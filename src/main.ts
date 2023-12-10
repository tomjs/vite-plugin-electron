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
  if (options.debug) {
    return;
  }

  await startup.exit();

  // start electron app
  process.electronApp = spawn(electron as any, ['.'], {
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
  options.debug && logger.warn(`debug mode`);

  const buildOptions = getBuildOptions(options);

  const buildCounts = [0, buildOptions.length > 1 ? 0 : 1];
  for (let i = 0; i < buildOptions.length; i++) {
    const tsOpts = buildOptions[i];
    const { __NAME__: name, onSuccess: _onSuccess, watch, ...tsupOptions } = tsOpts;

    logger.info(`${name} build`);

    const onSuccess: TsupOptions['onSuccess'] = async () => {
      if (typeof _onSuccess === 'function') {
        await _onSuccess();
      }

      if (buildCounts[i] <= 0) {
        buildCounts[i]++;
        logger.info(`${name} build succeeded`);

        if (buildCounts[0] == 1 && buildCounts[1] == 1) {
          logger.info('electron startup');
          await startup(options);
        }
        return;
      }

      logger.success(`${name} rebuild succeeded!`);

      if (name === 'main') {
        logger.info('electron restart');
        await startup(options);
      } else {
        logger.info('page reload');
        server.ws.send({
          type: 'full-reload',
        });
      }
    };

    await tsupBuild({ onSuccess, watch: true, ...tsupOptions });
  }
}

export async function runBuild(options: PluginOptions) {
  const buildOptions = getBuildOptions(options);
  for (let i = 0; i < buildOptions.length; i++) {
    await tsupBuild(buildOptions[i]);
  }
}
