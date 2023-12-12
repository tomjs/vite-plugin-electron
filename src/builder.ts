import type { Configuration } from 'electron-builder';
import type { ResolvedConfig } from 'vite';
import type { PluginOptions } from './types';
import os from 'node:os';
import path from 'node:path';
import { cwd } from 'node:process';
import merge from 'lodash.merge';
import shell from 'shelljs';
import { exec, readJson, writeJson } from './utils';

function getMirror() {
  let mirror = process.env.ELECTRON_MIRROR;
  if (mirror) {
    return mirror;
  }

  // check npm mirror
  const res = exec(os.platform() === 'win32' ? 'npm.cmd' : 'npm', ['config', 'get', 'registry']);
  if (res.status === 0) {
    let registry = res.stdout;
    if (!registry) {
      return;
    }

    registry = registry.trim();
    if (
      registry &&
      ['registry.npmmirror.com', 'registry.npm.taobao.org'].find(s => registry.includes(s))
    ) {
      mirror = 'https://npmmirror.com/mirrors/electron';
    }
  }

  return mirror;
}

function getBuilderConfig(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  createPkg(options, resolvedConfig);

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

  const { appId, productName } = options.builder || {};

  return merge(config, { appId, productName }, options.builder?.builderConfig);
}

function createPkg(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  const externals = options.external || [];
  const viteExternals = resolvedConfig.build.rollupOptions?.external;
  if (Array.isArray(viteExternals)) {
    externals.push(...viteExternals);
  } else if (typeof viteExternals === 'string') {
    externals.push(viteExternals);
  }

  const pkg = readJson(path.join(process.cwd(), 'package.json'));
  if (!pkg) {
    throw new Error(`package.json not found in ${process.cwd()}`);
  }

  const outDir = path.dirname(resolvedConfig.build.outDir);

  const newPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: pkg.type || 'commonjs',
    author: getAuthor(pkg.author),
    main: pkg.main
      ? pkg.main.replace('./', '').substring(pkg.main.indexOf(outDir) + outDir.length - 1)
      : `main/index.${options?.main?.format === 'esm' ? '' : 'm'}js`,
    dependencies: getDeps(),
  };

  writeJson(path.join(outDir, 'package.json'), newPkg);

  function getAuthor(author: any) {
    const uname = os.userInfo().username;
    if (!author) {
      return uname;
    } else if (typeof author === 'string') {
      return author;
    } else if (typeof author === 'object') {
      if (!author.name) {
        return uname;
      }
      const email = author.email ? ` <${author.email}>` : '';
      return `${author.name}${email}`;
    }
    return uname;
  }

  function checkDepName(rules: (string | RegExp)[], name: string) {
    return !!rules.find(s => {
      if (typeof s === 'string') {
        return s.includes(name);
      } else {
        return s.test(name);
      }
    });
  }

  function getDeps() {
    const deps = pkg.dependencies || {};
    const newDeps = {};
    Object.keys(deps).forEach(name => {
      if (checkDepName(externals, name)) {
        newDeps[name] = deps[name];
      }
    });
    return newDeps;
  }

  return newPkg;
}

export async function runElectronBuilder(options: PluginOptions, resolvedConfig: ResolvedConfig) {
  const DIST_PATH = path.join(cwd(), path.dirname(resolvedConfig.build.outDir));

  shell.exec(`cd ${DIST_PATH} && npm install`);

  const config = getBuilderConfig(options, resolvedConfig);
  const { build } = await import('electron-builder');
  await build({
    config,
  });
}
