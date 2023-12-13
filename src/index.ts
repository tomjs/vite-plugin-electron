import type { AddressInfo } from 'node:net';
import type { Plugin, ResolvedConfig } from 'vite';
import type { MainOptions, PluginOptions, PreloadOptions } from './types';
import fs, { mkdirSync, writeFileSync } from 'node:fs';
import { cwd } from 'node:process';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import path from 'path';
import { runElectronBuilder } from './builder';
import { PACKAGE_NAME, PLUGIN_NAME } from './constants';
import { runBuild, runServe } from './main';
import { readJson } from './utils';

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
    target: ['es2021', 'node16'],
    format,
    clean: true,
    dts: false,
    treeshake: !!isDev,
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : `.js`,
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

  ['main', 'preload'].forEach(prop => {
    const opt = opts[prop];
    const fmt = opt.format;
    opt.format = ['cjs', 'esm'].includes(fmt) ? [fmt] : [format];

    const entry = opt.entry;
    if (entry == undefined) {
      const filePath = `electron/${prop}/index.ts`;
      if (fs.existsSync(path.join(process.cwd(), filePath))) {
        opt.entry = [filePath];
      }
    } else if (typeof entry === 'string') {
      opt.entry = [entry];
    }

    const external = opt.external || opts.external || ['electron'];
    opt.external = [...new Set(['electron'].concat(external))];
  });

  return opts;
}

function geNumberBooleanValue(value?: string) {
  if (typeof value !== 'string') {
    return;
  }
  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }

  const v = Number(value);
  return Number.isNaN(v) ? undefined : v;
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
      } else {
        opts.main.outDir ||= path.join('dist-electron', 'main');
        opts.preload.outDir ||= path.join('dist-electron', 'preload');
      }

      if (isDev) {
        opts.main.sourcemap ??= true;
        opts.preload.sourcemap ??= true;
        // opts.inspect = opts.inspect ?? true;
      } else {
        opts.main.minify ??= true;
        opts.preload.minify ??= true;
      }

      let envPrefix = config.envPrefix;
      if (!envPrefix) {
        envPrefix = ['VITE_'];
      } else if (typeof envPrefix === 'string') {
        envPrefix = [envPrefix];
      }
      if (!envPrefix.includes('APP_')) {
        envPrefix.push('APP_');
      }

      return {
        envPrefix: [...new Set(envPrefix)],
        build: {
          outDir,
        },
      };
    },
    configResolved(config) {
      opts.debug = config.env.APP_ELECTRON_DEBUG ? !!config.env.APP_ELECTRON_DEBUG : opts.debug;
      opts.inspect = config.env.APP_ELECTRON_INSPECT
        ? geNumberBooleanValue(config.env.APP_ELECTRON_INSPECT)
        : opts.inspect;

      resolvedConfig = config;
    },
    configureServer(server) {
      if (!server || !server.httpServer) {
        return;
      }

      server.httpServer.on('listening', async () => {
        const serve = server.httpServer?.address() as AddressInfo;
        const { address, port, family } = serve;
        const hostname = family === 'IPv6' ? `[${address}]` : address;
        const protocol = server.config.server.https ? 'https' : 'http';
        process.env.APP_DEV_SERVER_URL = `${protocol}://${hostname}:${port}`;

        const DEBUG_PATH = path.resolve(cwd(), 'node_modules', PACKAGE_NAME, 'debug');
        if (!fs.existsSync(DEBUG_PATH)) {
          mkdirSync(DEBUG_PATH, { recursive: true });
        }
        const env = Object.keys(process.env)
          .filter(s => s.startsWith('APP_') || s.startsWith('VITE_'))
          .map(s => `${s}=${process.env[s]}`)
          .join('\n');
        writeFileSync(path.join(DEBUG_PATH, '.env'), `NODE_ENV=development\n${env}`);

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
