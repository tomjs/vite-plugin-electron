import type { ChildProcess } from 'node:child_process';
import type { Options as TsupOptions } from 'tsup';
import type { ViteDevServer } from 'vite';
import type { InnerOptions, PluginOptions } from './types';
import { spawn } from 'node:child_process';
import electron from 'electron';
import { lightGreen } from 'kolorist';
import { build as tsupBuild } from 'tsup';
import { createLogger } from './logger';

const logger = createLogger();

function getBuildOptions(options: PluginOptions, innerOpts: InnerOptions) {
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
    .map(s => {
      options[s].__NAME__ = s;
      return options[s];
    })
    .map(cfg => {
      return {
        ...cfg,
        env,
        silent: true,
      } as TsupOptions & { __NAME__: string };
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

export async function runServe(
  options: PluginOptions,
  innerOpts: InnerOptions,
  server: ViteDevServer,
) {
  let mainProcess: ChildProcess;

  const killProcess = () => {
    if (mainProcess) {
      mainProcess.off('exit', exitMainProcess);
      mainProcess.kill();
    }
  };

  process.on('exit', () => {
    killProcess();
  });

  const buildOptions = getBuildOptions(options, innerOpts);

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
        killProcess();
        mainProcess = runMainProcess(options, innerOpts);
      } else {
        server.ws.send({
          type: 'full-reload',
        });
      }
    };

    await tsupBuild({ onSuccess, watch: true, ...tsupOptions });
  }

  mainProcess = runMainProcess(options, innerOpts);

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
