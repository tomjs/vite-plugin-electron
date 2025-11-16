import type { Plugin, ResolvedConfig } from 'vite';
import type { MainOptions, PluginOptions, PreloadOptions } from './types';
import fs from 'node:fs';
import path from 'node:path';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { runElectronBuilder } from './builder';
import { PLUGIN_NAME } from './constants';
import { runBuild, runServe } from './main';
import { readJson, resolveServerUrl } from './utils';

export * from './types';

const isDev = process.env.NODE_ENV === 'development';

function getPkg() {
  const pkgFile = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgFile)) {
    throw new Error('Main file is not specified, and no package.json found');
  }

  const pkg = readJson(pkgFile);
  if (!pkg.main) {
    throw new Error('Main file is not specified, please check package.json');
  }

  return pkg;
}

function preMergeOptions(options?: PluginOptions) {
  const pkg = getPkg();
  const format = pkg.type === 'module' ? 'esm' : 'cjs';

  const electron: MainOptions | PreloadOptions = {
    target: format === 'esm' ? 'node18.18' : 'node16',
    format,
    shims: true,
    clean: true,
    dts: false,
    treeshake: !!isDev,
    outExtensions({ format }) {
      return {
        js: format === 'es' ? '.mjs' : '.js',
      };
    },
  };

  const opts: PluginOptions = merge(
    {
      recommended: true,
      debug: false,
      external: ['electron'],
      main: {
        ...electron,
      },
      preload: {
        ...electron,
      },
      builder: false,
    } as PluginOptions,
    cloneDeep(options),
  );

  ['main', 'preload'].forEach((prop) => {
    const opt = opts[prop];
    const fmt = opt.format;
    opt.format = ['cjs', 'esm'].includes(fmt) ? [fmt] : [format];

    const entry = opt.entry;
    if (entry === undefined) {
      const filePath = `electron/${prop}/index.ts`;
      if (fs.existsSync(path.join(process.cwd(), filePath))) {
        opt.entry = [filePath];
      }
    }
    else if (typeof entry === 'string') {
      opt.entry = [entry];
    }

    if (isDev) {
      opt.sourcemap ??= true;
    }
    else {
      opt.minify ??= true;
    }

    const external = opt.external || opts.external || ['electron'];
    opt.external = [...new Set(['electron'].concat(external))];
  });

  return opts;
}

function geNumberBooleanValue(value?: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    return;
  }
  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }

  const v = Number(value);
  return Number.isNaN(v) ? undefined : v;
}

function getBooleanValue(value?: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    return;
  }

  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }

  if (['1', '0'].includes(value)) {
    return value === '1';
  }
}

/**
 * A simple vite plugin for electron
 * @param options
 */

export function useElectronPlugin(options?: PluginOptions): Plugin {
  const opts = preMergeOptions(options);
  let isServer = false;

  let resolvedConfig: ResolvedConfig;

  return {
    name: PLUGIN_NAME,
    config(config, env) {
      isServer = env.command === 'serve';

      let outDir = config?.build?.outDir || 'dist';
      opts.main ||= {};
      opts.preload ||= {};
      if (opts.recommended) {
        opts.main.outDir = path.join(outDir, 'main');
        opts.preload.outDir = path.join(outDir, 'preload');
        outDir = path.join(outDir, 'renderer');
      }
      else {
        opts.main.outDir ||= path.join('dist-electron', 'main');
        opts.preload.outDir ||= path.join('dist-electron', 'preload');
      }

      return {
        build: {
          outDir,
        },
      };
    },
    configResolved(config) {
      opts.debug = getBooleanValue(config.env.VITE_ELECTRON_DEBUG) ?? opts.debug;
      opts.inspect = geNumberBooleanValue(config.env.VITE_ELECTRON_INSPECT) ?? opts.inspect;
      opts.builder = getBooleanValue(config.env.VITE_ELECTRON_BUILDER) ?? opts.builder;

      resolvedConfig = config;
    },
    configureServer(server) {
      if (!server || !server.httpServer) {
        return;
      }

      server.httpServer.on('listening', async () => {
        const env = {
          NODE_ENV: server.config.mode || 'development',
          VITE_DEV_SERVER_URL: resolveServerUrl(server),
        };

        ['main', 'preload'].forEach((prop) => {
          opts[prop].env = env;
        });

        await runServe(opts, server);
      });
    },
    async closeBundle() {
      if (isServer) {
        return;
      }
      await runBuild(opts);

      if (opts.recommended && opts.builder) {
        await runElectronBuilder(opts, resolvedConfig);
      }
    },
  };
}

export default useElectronPlugin;
