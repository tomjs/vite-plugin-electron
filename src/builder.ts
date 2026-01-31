import type { Configuration } from 'electron-builder';
import type { ResolvedConfig } from 'vite';
import type { PluginOptions } from './types';
import os from 'node:os';
import path from 'node:path';
import { execaSync } from 'execa';
import merge from 'lodash.merge';
import { logger } from './logger';
import { readJson, writeJson } from './utils';

function getMirror() {
  let mirror = process.env.ELECTRON_MIRROR;
  if (mirror) {
    return mirror;
  }

  // check npm mirror
  const res = execaSync('npm config get registry', { shell: true });
  if (res.exitCode === 0) {
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
      target: ['zip'],
      sign: async () => {},
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
    productName: pkg.productName,
    version: pkg.version,
    description: pkg.description,
    type: pkg.type || 'commonjs',
    author: pkg.author || getAuthor(pkg.author),
    main,
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

  return newPkg;
}

export async function runElectronBuilder(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  if (typeof options.builder == 'boolean' && options.builder === false) {
    return;
  }

  createPkg(options, resolvedConfig);
  logger.info(`created package.json`);
  const config = getBuilderConfig(options, resolvedConfig);

  const { build } = await import('electron-builder');
  await build({
    config,
  });
}
