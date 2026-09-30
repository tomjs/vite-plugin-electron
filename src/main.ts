import type { InlineConfig, ViteDevServer } from 'vite';
import type { MainOptions, PluginOptions, PreloadOptions } from './types';
import { spawn } from 'node:child_process';
import electron from 'electron';
import { execa } from 'execa';
import colors from 'picocolors';
import { build as viteBuild } from 'vite';
import { PLUGIN_NAME } from './constants';
import { ELECTRON_EXIT } from './electron';
import { logger } from './logger';
import { getNodeExternal, treeKillSync } from './utils';

const DEFAULT_IGNORE_WATCH = ['.history', '.temp', '.tmp', '.cache', 'dist'];

/**
 * ESM shim that reproduces the previous tsdown `shims` behavior.
 *
 * `__dirname` / `__filename` do not exist in ESM; they are computed from
 * `import.meta.url` and injected into the bundle via the output banner.
 * This keeps existing `main`/`preload` code written for CJS working under ESM.
 *
 * The shim is intentionally free of top-level imports/bindings so it can never
 * collide with the bundled code (e.g. `import path from "node:path"`).
 */
const ESM_SHIMS = [
  `import { dirname as __tomjs_dirname } from 'node:path';`,
  `import { fileURLToPath as __tomjs_fileURLToPath } from 'node:url';`,
  `const __dirname = import.meta.dirname ?? __tomjs_dirname(__tomjs_fileURLToPath(import.meta.url));`,
  `const __filename = import.meta.filename ?? __tomjs_fileURLToPath(import.meta.url);`,
  '',
].join('\n');

/** The Vite build watchers created in dev mode, kept alive until exit. */
const watchers: Array<{ close: () => Promise<void> | void }> = [];

function getBuildOptions(options: PluginOptions) {
  return ['main', 'preload']
    .filter(s => options[s] && options[s].entry)
    .map(s => ({ name: s, options: options[s]! }));
}

function arrayable<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Convert a `MainOptions`/`PreloadOptions` into a Vite `InlineConfig` that
 * compiles the Electron process with Vite itself (replacing the old tsdown build).
 */
function toViteConfig(opt: MainOptions | PreloadOptions, isServe: boolean): InlineConfig {
  const {
    entry,
    format,
    outDir,
    external,
    clean,
    treeshake,
    target,
    sourcemap,
    minify,
    watchFiles: _watchFiles,
    ignoreWatch,
    onSuccess: _onSuccess,
    env,
    logLevel,
    ...rest
  } = opt as unknown as Record<string, any>;

  const isEsm = format !== 'cjs';
  const jsExt = isEsm ? 'mjs' : 'js';

  const define: Record<string, string> = {};
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      define[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    ...rest,
    configFile: false,
    logLevel: logLevel ?? 'silent',
    resolve: {
      ...(rest.resolve || {}),
      conditions: [...new Set([...(rest.resolve?.conditions || []), 'node'])],
    },
    define: {
      ...define,
      ...(rest.define || {}),
    },
    build: {
      outDir,
      emptyOutDir: clean ?? true,
      copyPublicDir: false,
      sourcemap: sourcemap ?? false,
      minify: minify ?? false,
      target,
      lib: {
        entry,
        formats: [isEsm ? 'es' : 'cjs'],
        fileName: (_format, entryName) => `${entryName}.${jsExt}`,
      },
      rolldownOptions: {
        external: getNodeExternal(external ?? ['electron']),
        treeshake: treeshake ?? false,
        output: isEsm ? { banner: ESM_SHIMS } : undefined,
      },
      watch: isServe
        ? { exclude: [...DEFAULT_IGNORE_WATCH, ...(arrayable(ignoreWatch) || [])] }
        : undefined,
    },
  };
}

function closeWatchers() {
  for (const watcher of watchers) {
    try {
      watcher.close();
    }
    catch {
      // ignore close errors during shutdown
    }
  }
}

let hookedProcessExit = false;
function hookProcessExit() {
  if (hookedProcessExit) {
    return;
  }
  hookedProcessExit = true;
  process.once('exit', closeWatchers);
}

/**
 * startup electron app
 */
async function startup(options: PluginOptions) {
  if (options.debug) {
    return;
  }

  await startup.exit();

  const args = ['.', '--no-sandbox'];
  if (options.inspect) {
    if (typeof options.inspect === 'number') {
      args.push(`--inspect=${options.inspect}`);
    }
    else {
      args.push(`--inspect`);
    }
  }

  // start electron app
  process.electronApp = spawn(electron as any, args, {
    stdio: process.platform === 'linux'
      // reserve file descriptor 3 for Chromium; put Node IPC on file descriptor 4
      ? ['inherit', 'inherit', 'inherit', 'ignore', 'ipc']
      : ['inherit', 'inherit', 'inherit', 'ipc'],
  });

  // exit process after electron app exit
  process.electronApp.once('exit', process.exit);

  if (!startup.hookedProcessExit) {
    startup.hookedProcessExit = true;
    process.once('exit', startup.exit);
  }
}

startup.send = (message: string) => {
  if (process.electronApp) {
    // Based on { stdio: [,,, 'ipc'] }
    process.electronApp.send?.(message);
  }
};

startup.hookedProcessExit = false;
startup.exit = async () => {
  if (!process.electronApp) {
    return;
  }

  await new Promise((resolve) => {
    startup.send(ELECTRON_EXIT);
    process.electronApp.removeAllListeners();
    process.electronApp.once('exit', resolve);
    treeKillSync(process.electronApp.pid!);
  });
};

export async function runServe(options: PluginOptions, server: ViteDevServer) {
  options.debug && logger.warn(`debug mode`);

  const buildOptions = getBuildOptions(options);

  const buildCounts = [0, buildOptions.length > 1 ? 0 : 1];
  for (let i = 0; i < buildOptions.length; i++) {
    const { name, options: tsOpts } = buildOptions[i];
    const { onSuccess: _onSuccess } = tsOpts;

    logger.info(`${colors.dim(name)} build start`);

    const onSuccess = async () => {
      if (_onSuccess) {
        if (typeof _onSuccess === 'string') {
          await execa(_onSuccess);
        }
        else if (typeof _onSuccess === 'function') {
          await _onSuccess(undefined, undefined);
        }
      }

      if (buildCounts[i] <= 0) {
        buildCounts[i]++;
        logger.info(`${colors.dim(name)} build success`);

        if (buildCounts[0] === 1 && buildCounts[1] === 1) {
          logger.info('startup electron');
          await startup(options);
        }
        return;
      }

      logger.info(`${colors.dim(name)} rebuild success`);

      if (name === 'main') {
        logger.info('restart electron');
        await startup(options);
      }
      else {
        logger.info('reload page');
        server.ws.send({
          type: 'full-reload',
        });
      }
    };

    const config = toViteConfig(tsOpts, true);
    config.plugins = [
      ...(config.plugins || []),
      {
        name: `${PLUGIN_NAME}:${name}`,
        apply: 'build',
        writeBundle() {
          return onSuccess();
        },
      },
    ];

    // Build in watch mode. Returns a RolldownWatcher that keeps rebuilding
    // on file changes; the `writeBundle` hook above fires on every build.
    const watcher = await viteBuild(config);
    watchers.push(watcher as { close: () => Promise<void> | void });
    hookProcessExit();
  }
}

export async function runBuild(options: PluginOptions) {
  const buildOptions = getBuildOptions(options);
  for (let i = 0; i < buildOptions.length; i++) {
    await viteBuild(toViteConfig(buildOptions[i].options, false));
  }
}
