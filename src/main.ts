import type { Options as TsupOptions } from 'tsup';
import type { InnerOptions, PluginOptions } from './types';
import { ChildProcess, spawn } from 'node:child_process';
import electron from 'electron';
import { lightGreen } from 'kolorist';
import { build as tsupBuild } from 'tsup';
import { createLogger } from './logger';

const logger = createLogger();

function getBuildOptions(options: PluginOptions, innerOpts: InnerOptions): TsupOptions[] {
  const env = {
    APP_DEV_SERVER_URL: innerOpts?.serverUrl,
  };

  Object.keys(env).forEach(key => {
    if (env[key] === undefined) {
      delete env[key];
    }
  });

  return ['main', 'preload']
    .filter(s => options[s] && options[s].entry)
    .map(s => options[s])
    .map(cfg => {
      return {
        ...cfg,
        env,
        silent: true,
      } as TsupOptions;
    });
}

function exitMainProcess() {
  logger.info('exit main process');
  process.exit(0);
}

function runMainProcess(options: PluginOptions, innerOpts: InnerOptions) {
  const mainFile = innerOpts.mainFile as string;
  logger.info(`run main file: ${lightGreen(mainFile)}`);
  const args = options.inspect ? ['--inspect'] : [];
  return spawn(electron as any, [...args, mainFile], {
    stdio: 'inherit',
  }).on('exit', exitMainProcess);
}

export async function runServe(options: PluginOptions, innerOpts: InnerOptions) {
  let electronProcess: ChildProcess;

  const killProcess = () => {
    if (electronProcess) {
      electronProcess.off('exit', exitMainProcess);
      electronProcess.kill();
    }
  };

  process.on('exit', () => {
    killProcess();
  });

  logger.info(`electron server start`);

  const buildOptions = getBuildOptions(options, innerOpts);

  for (let i = 0; i < buildOptions.length; i++) {
    let isFirstBuild = true;
    const tsOpts = buildOptions[i];
    const { onSuccess: _onSuccess, watch, ...tsupOptions } = tsOpts;

    logger.info(`electron ${tsOpts.name} process build`);

    const onSuccess: TsupOptions['onSuccess'] = async () => {
      logger.info(`electron ${tsOpts.name} process build success`);

      if (typeof _onSuccess === 'function') {
        await _onSuccess();
      }

      logger.success('rebuild succeeded!');

      if (isFirstBuild) {
        isFirstBuild = false;
        return;
      }

      killProcess();

      electronProcess = runMainProcess(options, innerOpts);
    };

    await tsupBuild({ onSuccess, watch: true, ...tsupOptions });
  }

  electronProcess = runMainProcess(options, innerOpts);

  return {
    kill: killProcess,
  };
}

export async function runBuild(options: PluginOptions, innerOpts: InnerOptions) {
  const buildOptions = getBuildOptions(options, innerOpts);
  for (let i = 0; i < buildOptions.length; i++) {
    await tsupBuild(buildOptions[i]);
  }
}
