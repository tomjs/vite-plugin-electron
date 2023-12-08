import type { AddressInfo } from 'node:net';
import type { Plugin } from 'vite';
import type { InnerOptions, MainOptions, PluginOptions, PreloadOptions } from './types';
import fs from 'node:fs';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import path from 'path';
import { PLUGIN_NAME } from './constants';
import { runBuild, runServe } from './main';
import { readJson } from './utils';

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
        name: 'main',
        ...electron,
      },
      preload: {
        name: 'payload',
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
    if (typeof entry === 'string') {
      opt.entry = [entry];
    }

    const external = opt.external || opts.external || ['electron'];
    opt.external = [...new Set(['electron'].concat(external))];
  });

  const innerOpts: InnerOptions = {
    mainFile: pkg.main,
  };

  return { opts, innerOpts };
}

export function vitePluginElectron(options?: PluginOptions): Plugin {
  const { opts, innerOpts } = preMergeOptions(options);
  const isDev = process.env.NODE_ENV === 'development';

  return {
    name: PLUGIN_NAME,
    config(config, env) {
      innerOpts.isServer = env.mode === 'serve';

      let outDir = config?.build?.outDir || 'dist';
      opts.preload = opts.preload || {};
      if (opts.recommended) {
        opts.main.outDir = path.join(outDir, 'main');
        opts.preload.outDir = path.join(outDir, 'preload');
        outDir = path.join(outDir, 'renderer');
      } else {
        opts.main.outDir = opts.main.outDir || path.join('dist-electron', 'main');
        opts.preload.outDir = opts.preload.outDir || path.join('dist-electron', 'preload');
      }

      if (isDev) {
        opts.main.sourcemap = opts.main.sourcemap ?? true;
        opts.preload.sourcemap = opts.main.sourcemap ?? true;
        opts.inspect = opts.inspect ?? true;
      } else {
        opts.main.minify = opts.main.minify ?? true;
        opts.preload.minify = opts.preload.minify ?? true;
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
            innerOpts.serverUrl = `http://[${address}]:${port}`;
          } else {
            innerOpts.serverUrl = `http://${address}:${port}`;
          }
        }

        // @ts-ignore
        process.__tomjs_electron_serve__?.kill();
        // @ts-ignore
        process.__tomjs_electron_serve__ = await runServe(opts, innerOpts);
      });
    },
    async closeBundle() {
      if (innerOpts.isServer) {
        return;
      }
      await runBuild(opts, innerOpts);
    },
  };
}

export default vitePluginElectron;
