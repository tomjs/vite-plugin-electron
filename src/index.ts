import type { AddressInfo } from 'node:net';
import type { Plugin } from 'vite';
import type { MainOptions, PluginOptions, PreloadOptions } from './types';
import fs from 'node:fs';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import path from 'path';
import { PLUGIN_NAME } from './constants';
import { runBuild, runServe } from './main';
import { readJson } from './utils';

export * from './types';

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
    format,
    clean: true,
    dts: false,
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : `.js`,
      };
    },
  };

  const opts: PluginOptions = merge(
    {
      recommended: true,
      external: ['electron'],
      main: {
        ...electron,
      },
      preload: {
        ...electron,
      },
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

export function vitePluginElectron(options?: PluginOptions): Plugin {
  const opts = preMergeOptions(options);
  const isDev = process.env.NODE_ENV === 'development';
  let isServer = false;

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

      return {
        build: {
          outDir,
        },
      };
    },
    configureServer(server) {
      if (!server?.httpServer) {
        return;
      }

      server.httpServer.on('listening', async () => {
        if (server.httpServer) {
          const serve = server.httpServer.address() as AddressInfo;
          const { address, port, family } = serve;
          if (family === 'IPv6') {
            process.env.APP_DEV_SERVER_URL = `http://[${address}]:${port}`;
          } else {
            process.env.APP_DEV_SERVER_URL = `http://${address}:${port}`;
          }
        }

        await runServe(opts, server);
      });
    },
    async closeBundle() {
      if (isServer) {
        return;
      }
      await runBuild(opts);
    },
  };
}

export default vitePluginElectron;
