import type { Options as TsupOptions } from 'tsup';
import type { ViteDevServer } from 'vite';
import type { PluginOptions } from './types';
import { spawn } from 'node:child_process';
import electron from 'electron';
import treeKill from 'tree-kill';
import { build as tsupBuild } from 'tsup';
import { createLogger } from './logger';

const logger = createLogger();

function getBuildOptions(options: PluginOptions) {
  return ['main', 'preload']
    .filter(s => options[s] && options[s].entry)
    .map(s => {
      options[s].__NAME__ = s;
      return options[s];
    })
    .map(cfg => {
      return {
        ...cfg,
        silent: true,
      } as TsupOptions & { __NAME__: string };
    });
}

/**
 *
 */
async function startup(options: PluginOptions) {
  await startup.exit();

  const args: string[] = [];
  options.inspect && args.push('--inspect');

  // start electron app
  process.electronApp = spawn(electron as any, ['.', ...args], {
    stdio: 'inherit',
  });

  // exit process after electron app exit
  process.electronApp.once('exit', process.exit);

  process.once('exit', () => {
    startup.exit();
    process.electronApp.kill();
  });
}

startup.exit = async () => {
  if (!process.electronApp) {
    return;
  }

  process.electronApp.removeAllListeners();

  return new Promise((resolve, reject) => {
    treeKill(process.electronApp.pid!, err => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

export async function runServe(options: PluginOptions, server: ViteDevServer) {
  const buildOptions = getBuildOptions(options);

  for (let i = 0; i < buildOptions.length; i++) {
    let isFirstBuild = true;
    const tsOpts = buildOptions[i];
    const { __NAME__: name, onSuccess: _onSuccess, watch, ...tsupOptions } = tsOpts;

    logger.info(`${name} build`);

    const onSuccess: TsupOptions['onSuccess'] = async () => {
      if (typeof _onSuccess === 'function') {
        await _onSuccess();
      }

      if (isFirstBuild) {
        logger.info(`${name} build succeeded`);
        isFirstBuild = false;
        return;
      }

      logger.success(`${name} rebuild succeeded!`);

      if (name === 'main') {
        console.log('main process exit');
        await startup(options);
      } else {
        server.ws.send({
          type: 'full-reload',
        });
      }
    };

    await tsupBuild({ onSuccess, watch: true, ...tsupOptions });
  }

  await startup(options);
}

export async function runBuild(options: PluginOptions) {
  const buildOptions = getBuildOptions(options);
  for (let i = 0; i < buildOptions.length; i++) {
    await tsupBuild(buildOptions[i]);
  }
}
