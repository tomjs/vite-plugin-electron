import type { Configuration } from 'electron-builder';
import type { UserConfig as ViteOptions } from 'vite';

type Arrayable<T> = T | T[];

/**
 * Common options shared by the Electron `main` and `preload` process builds.
 *
 * The processes are now compiled with [Vite](https://vite.dev/) itself (the plugin
 * invokes Vite's `build()` API, replacing the previous tsdown/tsup pipeline), so this
 * interface inherits every top-level [Vite UserConfig](https://vite.dev/config/) option.
 *
 * The following fields are managed by the plugin and therefore omitted from the
 * inheritance: `configFile`, `base`, `root` and `build`.
 */
export interface ElectronProcessOptions
  extends Omit<ViteOptions, 'configFile' | 'base' | 'root' | 'build'> {
  /**
   * The process entry file(s).
   *
   * When `recommended` is enabled and no entry is given, the plugin looks for
   * `electron/main/index.ts` / `electron/preload/index.ts` automatically.
   */
  entry?: string | string[] | Record<string, string>;
  /**
   * The bundle format. If not specified, it will use the `type` field from `package.json`.
   */
  format?: 'cjs' | 'esm';
  /**
   * The output directory for the process files.
   *
   * @default 'dist/main' (or 'dist/preload') when `recommended: true`,
   * otherwise 'dist-electron/main' (or 'dist-electron/preload')
   */
  outDir?: string;
  /**
   * Don't bundle these modules. Node.js built-ins and `electron` are always excluded.
   */
  external?: string[];
  /**
   * Empty the output directory before building.
   * @default true
   */
  clean?: boolean;
  /**
   * Enable/disable tree-shaking.
   * @default true in development, false in production
   */
  treeshake?: boolean;
  /**
   * The Node.js build target, passed to Vite's `build.target`.
   * @default 'node18.18' for `esm`, 'node16' for `cjs`
   */
  target?: string | false;
  /**
   * Whether to generate sourcemaps.
   * @default true in development, false in production
   */
  sourcemap?: boolean | 'inline' | 'hidden';
  /**
   * Minify the output. `true` is an alias for `'oxc'`.
   * @default false in development, true in production
   */
  minify?: boolean | 'oxc' | 'terser' | 'esbuild';
  /**
   * Additional files or folders to watch for rebuilding (dev mode).
   *
   * Note: with Vite the full module dependency graph is always watched, so this is
   * only needed to force rebuilds for files that are not part of the graph.
   */
  watchFiles?: string | string[];
  /**
   * Files or folders to ignore while watching.
   * @default ['.history', '.temp', '.tmp', '.cache', 'dist']
   */
  ignoreWatch?: Arrayable<string | RegExp>;
  /**
   * A shell command or callback to run after every successful build (dev mode).
   */
  onSuccess?: string | ((config?: unknown, signal?: unknown) => void | Promise<void>);
  /**
   * Environment variables inlined into the bundle via Vite's `define`.
   * @internal
   */
  env?: Record<string, string>;
}

/**
 * Configuration options for the Electron `main` process build.
 */
export interface MainOptions extends ElectronProcessOptions {}

/**
 * Configuration options for the Electron `preload` process build.
 */
export interface PreloadOptions extends ElectronProcessOptions {}

/**
 * When `recommended` and `builder.enable` are both `true`, use [electron-builder](https://www.electron.build) to package Electron applications.
 *
 * In the `build.outDir` directory configured in vite, generate a new package.json based on the configuration and package.json, excluding non-dependencies.
 * Execute `npm install` and then package.
 */
export interface BuilderOptions {
  /**
   * The application id. Used as [CFBundleIdentifier](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102070) for MacOS and as
   * [Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) for Windows (NSIS target only, Squirrel.Windows not supported). It is strongly recommended that an explicit ID is set.
   * @default com.electron.${name}
   */
  appId?: string | null;
  /**
   * As [name](#Metadata-name), but allows you to specify a product name for your executable which contains spaces and other special characters not allowed in the [name property](https://docs.npmjs.com/files/package.json#name).
   * If not specified inside of the `build` configuration, `productName` property defined at the top level of `package.json` is used. If not specified at the top level of `package.json`, [name property](https://docs.npmjs.com/files/package.json#name) is used.
   */
  productName?: string | null;
  /**
   * The [electron-builder](https://www.electron.build/configuration/configuration) configuration.
   */
  builderConfig?: Configuration;
}

/**
 * vite plugin options
 */
export interface PluginOptions {
  /**
   * Recommended switch. Default is true.
   * if true, will have the following default behavior:
   * will change the main/preload/renderer outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change main/preload/render to 'dist/main' and 'dist/preload' and 'dist/renderer'
   * @default true
   */
  recommended?: boolean;
  /**
   * electron main process options
   */
  main?: MainOptions;
  /**
   * electron preload process options
   */
  preload?: PreloadOptions;
  /**
   * When `recommended` and `builder.enable` are both `true`, use [electron-builder](https://www.electron.build) to package Electron applications.
   *
   * In the `build.outDir` directory configured in vite, generate a new package.json based on the configuration and package.json, excluding non-dependencies.
   * Execute `npm install` and then package.
   */
  builder?: boolean | BuilderOptions;
  /**
   * electron debug mode, don't startup electron. You can also use `process.env.VITE_ELECTRON_DEBUG`. Default is false.
   * @default false
   */
  debug?: boolean;
  /**
   * Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port.
   * You can also use `process.env.VITE_ELECTRON_INSPECT`. See [debugging-main-process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process) for more information.
   * The default port is false.
   * @see https://www.electronjs.org/docs/latest/tutorial/debugging-main-process
   * @default false
   */
  inspect?: number | boolean;
  /**
   * Whether to enable devtools. Inject `<script src="http://localhost:<devtools-port>"></script>` into webview client . Default is true.
   *  - true:
   *    - react: inject `<script src="http://localhost:8097"></script>`
   *    - vue: inject `<script src="http://localhost:8098"></script>`
   *  - `number`: custom port
   * @default false
   */
  devtools?: boolean | number;
}
