import type { Configuration } from 'electron-builder';
import type { ResolvedConfig } from 'vite';
import type { PluginOptions } from './types';
import os from 'node:os';
import path from 'node:path';
import { cwd } from 'node:process';
import merge from 'lodash.merge';
import shell from 'shelljs';
import { createLogger } from './logger';
import { readJson, writeJson } from './utils';

const logger = createLogger();

function getMirror() {
  let mirror = process.env.ELECTRON_MIRROR;
  if (mirror) {
    return mirror;
  }

  // check npm mirror
  const res = shell.exec('npm config get registry', { silent: true });
  if (res.code === 0) {
    let registry = res.stdout;
    if (!registry) {
      return;
    }

    registry = registry.trim();
    if (
      registry
      && ['registry.npmmirror.com', 'registry.npm.taobao.org'].find(s => registry.includes(s))
    ) {
      mirror = 'https://npmmirror.com/mirrors/electron';
    }
  }

  return mirror;
}

function getBuilderConfig(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  const config: Configuration = {
    directories: {
      buildResources: 'electron/build',
      app: path.dirname(resolvedConfig.build.outDir),

      output: 'release/${version}',
    },
    files: ['main', 'preload', 'renderer'],

    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
    electronDownload: {
      mirror: getMirror(),
    },
    electronLanguages: ['zh-CN', 'en-US'],
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64'],
        },
      ],
    },
    mac: {
      target: ['dmg'],
    },
    linux: {
      target: ['zip'],
    },
    nsis: {
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      deleteAppDataOnUninstall: false,
    },
  };

  if (typeof options.builder == 'boolean') {
    return config;
  }

  const { appId, productName } = options.builder || {};
  return merge(config, { appId, productName }, options.builder?.builderConfig);
}

function createPkg(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  const externals = options.external || [];
  const viteExternals = resolvedConfig.build.rollupOptions?.external;
  if (Array.isArray(viteExternals)) {
    externals.push(...viteExternals);
  }
  else if (typeof viteExternals === 'string') {
    externals.push(viteExternals);
  }

  const pkg = readJson(path.join(process.cwd(), 'package.json'));
  if (!pkg) {
    throw new Error(`package.json not found in ${process.cwd()}`);
  }

  const outDir = path.dirname(resolvedConfig.build.outDir);

  let main = pkg.main;
  if (main) {
    main = main.replace('./', '');
    main = main.substring(main.indexOf(outDir) + outDir.length);
    if (main.startsWith('/')) {
      main = main.substring(1);
    }
  }
  else {
    main = `main/index.${options?.main?.format === 'esm' ? '' : 'm'}js`;
  }

  const newPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: pkg.type || 'commonjs',
    author: getAuthor(pkg.author),
    main,
    dependencies: getDeps(),
  };

  writeJson(path.join(outDir, 'package.json'), newPkg);

  function getAuthor(author: any) {
    const uname = os.userInfo().username;
    if (!author) {
      return uname;
    }
    else if (typeof author === 'string') {
      return author;
    }
    else if (typeof author === 'object') {
      if (!author.name) {
        return uname;
      }
      const email = author.email ? ` <${author.email}>` : '';
      return `${author.name}${email}`;
    }
    return uname;
  }

  function checkDepName(rules: (string | RegExp)[], name: string) {
    return !!rules.find((s) => {
      if (typeof s === 'string') {
        return s.includes(name);
      }
      else {
        return s.test(name);
      }
    });
  }

  function getDeps() {
    const deps = pkg.dependencies || {};
    const newDeps = {};
    Object.keys(deps).forEach((name) => {
      if (checkDepName(externals, name)) {
        newDeps[name] = deps[name];
      }
    });
    return newDeps;
  }

  return newPkg;
}

export async function runElectronBuilder(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  if (typeof options.builder == 'boolean' && options.builder === false) {
    return;
  }

  logger.info('building electron app...');

  const DIST_PATH = path.join(cwd(), path.dirname(resolvedConfig.build.outDir));

  createPkg(options, resolvedConfig);

  logger.info(`create package.json and exec "npm install"`);
  shell.exec(`cd ${DIST_PATH} && npm install --emit=dev`);

  logger.info(`run electron-builder to package app`);
  const config = getBuilderConfig(options, resolvedConfig);
  const { build } = await import('electron-builder');
  await build({
    config,
  });
}
