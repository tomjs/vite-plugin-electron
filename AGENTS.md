# Agent Guide — @tomjs/vite-plugin-electron

This file is a concise guide for AI coding agents (and human contributors) working on this repository. It describes what the project does, how the code is organized, which commands to run, and the important conventions and pitfalls to respect.

## Project Overview

[@tomjs/vite-plugin-electron](https://github.com/tomjs/vite-plugin-electron) is a [Vite](https://vitejs.dev/) plugin that builds the Electron `main` and `preload` processes and wires them into the Vite dev/build lifecycle:

- Builds `main` and `preload` with [Vite](https://vite.dev/) itself (Vite 8 is Rolldown-based) instead of bundling them with Vite's renderer pipeline.
- Supports `esm` and `cjs` output; `esm` works on Electron >= 28.
- Provides **Hot Restart** for the main process and **Hot Reload** for the preload process.
- Optionally drives [electron-builder](https://www.electron.build/) packaging with sensible defaults.
- Serves as the "recommended" zero-configuration setup for the standard project layout.

It was inspired by [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) and [doubleshot](https://github.com/Doubleshotjs/doubleshot). The package is published on npm as `@tomjs/vite-plugin-electron`.

## Tech Stack

- **Language**: TypeScript (strict, `@tomjs/tsconfig` base), ESM (`"type": "module"`).
- **Build tool for this package**: [tsdown](https://tsdown.dev/) (see `tsdown.config.ts`; the package itself is still built with tsdown — only the consumer `main`/`preload` compilation moved to Vite).
- **Vite**: peer `^8.0.0` (Vite 8 is Rolldown-based). The plugin invokes Vite's `build()` API for `main`/`preload`.
- **Package manager**: [pnpm](https://pnpm.io/) (`packageManager: pnpm@10.34.5`, workspace root).
- **Linting**: ESLint via `@tomjs/eslint-config` (flat config), stylelint for example stylesheets.
- **Commit conventions**: `commitlint` with `@tomjs/commitlint-config`, enforced by `simple-git-hooks` + `lint-staged`. Conventional Commits style (see commit history: `feat:`, `fix:`, `chore:`, `docs:`).
- **Runtime**: Node >= 20.19.0; peer dependencies `electron >= 12`, `electron-builder >= 24.2` (optional), `vite ^8.0.0`.

## Repository Layout

```
|-- src/                  # Plugin source (the package itself)
|  |-- index.ts           # Plugin entry: option merging + Vite plugin hooks
|  |-- main.ts            # Vite build orchestration (main/preload), dev watch, electron startup
|  |-- builder.ts         # electron-builder integration
|  |-- electron.ts        # ELECTRON_EXIT IPC message constant
|  |-- types.ts           # Public option interfaces (PluginOptions, MainOptions, ...)
|  |-- utils.ts           # fs/json helpers, URL resolution, process tree kill
|  |-- constants.ts       # PLUGIN_NAME, PACKAGE_NAME
|  |-- logger.ts          # Vite logger wrapper with [tomjs:electron] prefix
|  |-- env.d.ts           # Process.electronApp augmentation
|-- examples/             # Runnable demo apps: examples/vue and examples/react
|-- env.d.ts              # Public ambient types shipped to consumers (VITE_* env vars)
|-- tsdown.config.ts      # Build config for publishing this package
|-- tsconfig.json         # TS project config
|-- eslint.config.mjs     # Flat ESLint config
```

## Common Commands

Run from the repository root unless noted:

| Command               | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `pnpm install`        | Install all dependencies (workspace root + examples).                  |
| `pnpm dev`            | Watch-build the package with tsdown (`tsdown --watch`).                |
| `pnpm build`          | Build the package to `dist/` (tsdown). Also runs via `prepublishOnly`. |
| `pnpm lint`           | Run `stylelint` then `eslint --fix` over the repo.                     |
| `pnpm lint:eslint`    | ESLint with `--fix`.                                                   |
| `pnpm lint:stylelint` | stylelint over example styles.                                         |

### Examples (require `pnpm build` first so `dist/` exists)

From `examples/vue` or `examples/react`:

| Command           | Purpose                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`        | Start Vite dev server + launch Electron with hot restart/reload.                 |
| `pnpm debug`      | `VITE_ELECTRON_DEBUG=1 vite` — do not launch Electron, for attaching a debugger. |
| `pnpm build`      | Type-check + build (vue example runs `vue-tsc --noEmit` first).                  |
| `pnpm build:pack` | `VITE_ELECTRON_BUILDER=1 vite build` — build then package with electron-builder. |

There is **no test suite** in this repository; correctness is validated through the examples and `pnpm lint` + `pnpm build`.

## How the Plugin Works

The plugin's single entry point is `useElectronPlugin(options?)` in `src/index.ts`, which returns a Vite `Plugin`.

### 1. Option resolution (`preMergeOptions`)

- Reads the consumer's `package.json` (throws if no `main` field) to infer the output `format` (`esm` for `"type": "module"`, else `cjs`).
- Builds a shared base Vite build config (`target: 'node18.18'` for esm / `'node16'` for cjs, `format`, `clean: true`, `treeshake: isDev`).
- Merges defaults with the user's options via `lodash.merge` (deep clone of user options first).
- For both `main` and `preload`:
  - Normalizes `format` to a single `'cjs' | 'esm'` value.
  - Auto-detects the entry at `electron/{main|preload}/index.ts` when not specified.
  - Dev mode: `sourcemap ??= true`; build mode: `minify ??= true`.
  - Always forces `electron` into `external`.

### 2. Vite plugin hooks

- `config`: when `recommended` is on, splits Vite's `build.outDir` into sibling dirs — `dist/main`, `dist/preload`, and `dist/renderer` — and redirects the renderer output to `dist/renderer`. Otherwise defaults to `dist-electron/main` and `dist-electron/preload`.
- `configResolved`: applies environment overrides — `VITE_ELECTRON_DEBUG`, `VITE_ELECTRON_INSPECT`, `VITE_ELECTRON_BUILDER` — over the matching options (booleans use `getBooleanValue`, inspect uses `geNumberBooleanValue` to accept `true`/`false` or a port number).
- `configureServer`: when the dev server is listening, builds `main`/`preload` via `runServe` (`src/main.ts`) with `VITE_DEV_SERVER_URL` and `NODE_ENV` injected into their env.
- `transformIndexHtml`: when `devtools` is enabled, injects a React DevTools (`:8097`) or Vue DevTools (`:8098`) script tag before `</head>` (custom port when a `number` is given).
- `closeBundle`: on a production build, runs `runBuild` for both processes; if `recommended && builder`, then runs `runElectronBuilder` (`src/builder.ts`).

### 3. Dev-mode orchestration (`src/main.ts`)

- `toViteConfig` converts each process's options into a Vite `InlineConfig` (`configFile: false`, lib mode, `resolve.conditions: ['node']`, externals via `getNodeExternal`, `env` → `define`). ESM output gets a `__dirname`/`__filename` shim injected via `rolldownOptions.output.banner` (Rolldown offsets sourcemaps correctly).
- Builds `main` and `preload` with Vite's `build()` in **watch** mode (`build.watch`), which returns a `RolldownWatcher`. Vite watches the module dependency graph automatically, so `watchFiles` is only needed for files outside the graph. A per-process `writeBundle` plugin hook fires the `onSuccess` logic on every build (initial + rebuilds).
- On first successful build of both processes it launches Electron via `spawn` with `stdio: ['inherit','inherit','inherit','ipc']`.
- On rebuild of `main`: restarts Electron (`startup()`).
- On rebuild of `preload`: sends a `full-reload` over Vite's HMR websocket.
- Restart flow: sends `ELECTRON_EXIT` over IPC, then force-kills the process tree (`treeKillSync`). Consumers listen for `ELECTRON_EXIT` in the main process to e.g. close DevTools so Electron shuts down cleanly.
- Watchers are collected and closed on process exit.

### 4. Packaging (`src/builder.ts`)

- Generates a trimmed `package.json` in the app output dir (keeps `name/productName/version/description/type/author/main`, rewrites `main` relative to the output dir).
- Builds an electron-builder `Configuration` with defaults (two-package structure: `directories.app` = dirname of renderer outDir, `files: ['main','preload','renderer']`, NSIS for Windows, DMG/zip for macOS, zip for Linux).
- Detects a China npm mirror (`registry.npmmirror.com` / `registry.npm.taobao.org`) to auto-set the Electron download mirror; honors `ELECTRON_MIRROR` env var.

## Key Files at a Glance

| File               | Responsibility                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Public API (`useElectronPlugin`), option merge, all Vite hooks.                                             |
| `src/main.ts`      | Vite builds of main/preload (lib mode, `toViteConfig`), dev watch, Electron spawn/restart, HMR full-reload. |
| `src/builder.ts`   | electron-builder config generation, trimmed `package.json`, packaging.                                      |
| `src/types.ts`     | Public types: `PluginOptions`, `MainOptions`, `PreloadOptions`, `BuilderOptions`.                           |
| `src/utils.ts`     | `readJson`/`writeJson`, `getNodeExternal`, `resolveServerUrl`, `treeKillSync`.                              |
| `src/electron.ts`  | `ELECTRON_EXIT` constant (imported by consumer main processes).                                             |
| `src/logger.ts`    | Vite logger with `[tomjs:electron]` prefix and timestamps.                                                  |
| `src/constants.ts` | `PLUGIN_NAME = 'tomjs:electron'`, `PACKAGE_NAME`.                                                           |

## Conventions and Gotchas

- **Always read the consumer's `package.json`** — the plugin infers output format and entry paths from it; never hardcode assumptions about the consuming project.
- **`.mjs` vs `.js` suffixes** are determined by the build `format` via `lib.fileName`: esm → `.mjs`, cjs → `.js`. Preload output must use `.mjs` for `esm` because Electron's preload script loading requires it (documented in the README). Keep the mapping consistent.
- **ESM shims**: `__dirname`/`__filename` don't exist in ESM, so `src/main.ts` injects them via `rolldownOptions.output.banner` (the `ESM_SHIMS` constant), replicating the old tsdown `shims` behavior. If you change the shim, verify both the output and sourcemaps.
- **`process.electronApp`** is a global augmentation (see `src/env.d.ts`). Any change to how Electron is spawned must preserve the `'ipc'` stdio channel used to send `ELECTRON_EXIT`.
- **Watch-mode**: with Vite, the module dependency graph is always watched, so the old "must set `watchFiles` or Electron restarts indefinitely" pitfall is mostly gone; `watchFiles` now only adds watches for files outside the graph. `ignoreWatch` maps to `build.watch.exclude`.
- **Dev vs production behavior differs**: `sourcemap`/`minify` defaults flip based on `NODE_ENV`/`isDev`; `config` hook only redirects outDir when `recommended`; `closeBundle` skips dev server builds. Preserve these branches.
- **Environment variables** are the plugin's public configuration surface for debug/inspect/builder — keep `VITE_ELECTRON_*` handling in `configResolved` and their typings in `env.d.ts` in sync.
- **Dependencies**: use `lodash.clonedeep` / `lodash.merge` for option merging (don't hand-roll deep merge), `execa` for process execution, `picocolors` for colored logging.
- **External modules**: `electron` (and Node built-ins via `getNodeExternal`) must never be bundled; they are resolved at runtime from the consumer's environment.
- **Code style**: this repo follows the `@antfu` ESLint config conventions — no semicolons, single quotes, 2-space indent, trailing commas. Run `pnpm lint` and fix before committing.
- **Commits** must follow Conventional Commits (enforced by commitlint + simple-git-hooks). Releases are `chore: release vX.Y.Z` commits; keep the `CHANGELOG.md` updated alongside version bumps.
- **Documentation parity**: the README has an English (`README.md`) and Chinese (`README.zh_CN.md`) version — when changing documented behavior (options, env vars, defaults), update both.
- **Examples are the smoke tests**: after changing plugin behavior, run at least one example (`pnpm build && pnpm dev` in `examples/vue` or `examples/react`) to verify Electron starts and hot-restart/reload work.

## Common Pitfalls When Editing

1. **Option merge order**: `preMergeOptions` merges defaults with a _clone_ of user options. Adding a new default option means updating both the merged default object and the `ElectronProcessOptions` type in `src/types.ts`, plus the README tables.
2. **`recommended` branches**: many hooks branch on `opts.recommended` (outDir layout, watchFiles, builder behavior). A change in one branch usually requires a matching change in the other.
3. **Restart deadlocks**: `startup.exit` awaits the Electron process exit after sending `ELECTRON_EXIT`; if a new `startup()` is called before the old one exits, ensure listeners are removed (`removeAllListeners`) to avoid leaked handlers.
4. **Renderer outDir redirect**: with `recommended`, the renderer output moves to `<outDir>/renderer`. Anything reading `config.build.outDir` (e.g. the builder's `directories.app`) relies on this; keep the path math consistent.
