import type { UserConfig as TsdownOptions } from 'tsdown';
import type { ViteDevServer } from 'vite';
import type { MainOptions, PluginOptions, PreloadOptions } from './types';
import { spawn } from 'node:child_process';
import electron from 'electron';
import { execa } from 'execa';
import { build as tsdownBuild } from 'tsdown';
import { ELECTRON_EXIT } from './electron';
import { createLogger } from './logger';
import { treeKillSync } from './utils';

const logger = createLogger();

function getBuildOptions(options: PluginOptions) {
  return ['main', 'preload']
    .filter(s => options[s] && options[s].entry)
    .map((s) => {
      options[s].__NAME__ = s;
      return options[s];
    })
    .map((cfg) => {
      return {
        ...cfg,
        logLevel: 'silent',
      } as (MainOptions | PreloadOptions) & { __NAME__: string };
    });
}

/**
 * startup electron app
 */
async function startup(options: PluginOptions) {
  console.log('startup electron debug mode:', options.debug);
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
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
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
    const tsOpts = buildOptions[i];
    const { __NAME__: name, ignoreWatch, onSuccess: _onSuccess, watchFiles, ...tsupOptions } = tsOpts;

    logger.info(`${name} build`);

    const onSuccess: TsdownOptions['onSuccess'] = async (config, signal) => {
      if (_onSuccess) {
        if (typeof _onSuccess === 'string') {
          await execa(_onSuccess);
        }
        else if (typeof _onSuccess === 'function') {
          await _onSuccess(config, signal);
        }
      }

      if (buildCounts[i] <= 0) {
        buildCounts[i]++;
        logger.info(`${name} build success`);

        if (buildCounts[0] === 1 && buildCounts[1] === 1) {
          logger.info('startup electron');
          await startup(options);
        }
        return;
      }

      logger.success(`${name} rebuild success`);

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

    await tsdownBuild({
      onSuccess,
      ...tsupOptions,
      watch: watchFiles ?? (options.recommended ? [`electron/${name}`] : true),
      ignoreWatch: (Array.isArray(ignoreWatch) ? ignoreWatch : []).concat(['.history', '.temp', '.tmp', '.cache', 'dist']),
    });
  }
}

export async function runBuild(options: PluginOptions) {
  const buildOptions = getBuildOptions(options);
  for (let i = 0; i < buildOptions.length; i++) {
    await tsdownBuild(buildOptions[i]);
  }
}
