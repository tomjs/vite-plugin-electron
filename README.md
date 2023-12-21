# @tomjs/vite-plugin-electron

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-electron)](https://www.npmjs.com/package/@tomjs/vite-plugin-electron) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-electron) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-electron) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-electron)

**English** | [中文](./README.zh_CN.md)

> A Simple [vite](https://vitejs.dev/) plugin for [electron](https://www.electronjs.org), supports `esm` and `cjs`.

Many thanks to [caoxiemeihao](https://github.com/caoxiemeihao)'s [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) and [Doubleshotjs](https://github.com/Doubleshotjs)'s [doubleshot](https://github.com/Doubleshotjs/doubleshot) These two excellent libraries inspired me. I hope to use it to simplify development configuration and focus only on business development.

## Features

- Fast build `main` and `preload` with [tsup](https://github.com/egoist/tsup)
- Little configuration, focus on business
- Support `main`'s `Hot Restart`
- Support `preload`'s `Hot Reload`
- Support `esm` and `cjs`, you can use `esm` in [electron v28+](https://www.electronjs.org/blog/electron-28-0)
- Support `vue` and `react` and other [frameworks](https://vitejs.dev/guide/#trying-vite-online) supported by `vite`
- Optional [electron-builder](https://www.electron.build/) Simple configuration

## Install

```bash
# pnpm
pnpm add @tomjs/vite-plugin-electron -D

# yarn
yarn add @tomjs/vite-plugin-electron -D

# npm
npm i @tomjs/vite-plugin-electron --save-dev
```

If you use `builder` to package your application, please install `electron-builder`

```bash
# pnpm
pnpm add electron-builder -D

# yarn
yarn add electron-builder -D

# npm
npm i electron-builder --save-dev
```

## Usage

### Recommended Agreement

#### Directory Structure

- Recommend `electron` and page `src` code directory structure

```
|--electron
|  |--main        // main process code
|  |  |--index.ts
|  |--preload     // preload process code
|  |  |--index.ts
|  |--build       // electron-builder resources for electron package
|  |  |--icons
|--src            // front-end code
|  |--App.vue
|  |--main.ts
```

- Zero configuration, default dist output directory

```
|--dist
|  |--main
|  |  |--index.js
|  |  |--index.js.map
|  |--preload
|  |  |--index.js
|  |  |--index.js.map
|  |--renderer
|  |  |--index.html
```

#### Default configuration and behavior

See [PluginOptions](#pluginoptions) and `recommended` parameter descriptions in detail

### electron

`electron/main/index.ts`

```ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';

// when package.json "type": module"
global.__dirname = dirname(fileURLToPath(import.meta.url));

const preload = join(__dirname, '../preload/index.mjs');
const url = process.env.VITE_DEV_SERVER_URL;

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    width: 800,
    height: 700,
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    win.loadURL(url);
  } else {
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(createWindow);
```

### vue

Take using `esm` as an example, but it requires Electron>=28

- `package.json`

Electron `preload process` must use the `.mjs` suffix, otherwise an error will be reported, see [official documentation](https://www.electronjs.org/zh/docs/latest/tutorial/esm). So the default output of `esm` of `preload` uses the `.mjs` suffix. For consistency, `main process` also ends with `.mjs`

```json
{
  "type": "module",
  "main": "dist/main/index.mjs"
}
```

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
// import renderer from 'vite-plugin-electron-renderer'; // Enable nodeIntegration
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [
    vue(),
    // If you use the agreed directory structure, no configuration is required
    electron(),
    // If the directory structure is customized, the value must be assigned according to the actual situation
    // electron({
    //   main: {
    //     entry: 'electron/main/index.ts',
    //   },
    //   preload: {
    //     entry: 'electron/preload/index.ts',
    //   },
    // }),
    // renderer(),
  ],
});
```

### react

Take using `cjs` as an example

- `package.json`

```json
{
  // "type": "commonjs",
  "main": "dist/main/index.js"
}
```

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react(), electron()],
});
```

## Documentation

- [API Documentation](https://paka.dev/npm/@tomjs/vite-plugin-electron) provided by [paka.dev](https://paka.dev).
- [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-electron/dist/index.d.ts) provided by [unpkg.com](https://www.unpkg.com).

## Parameters

### PluginOptions

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | This option is intended to provide recommended default parameters and behavior. |
| external | `string[]` |  | Don't bundle these modules, but dependencies and peerDependencies in your package.json are always excluded.[See more](https://tsup.egoist.dev/#excluding-packages) |
| main | [MainOptions](#MainOptions) |  | Configuration options for the electron main process. |
| preload | [PreloadOptions](#PreloadOptions) |  | Configuration options for the electron preload process. |
| debug | `boolean` | `false` | Electron debug mode, don't startup electron. You can also use `process.env.VITE_ELECTRON_DEBUG`. Default is false. |
| builder | `boolean` \| [BuilderOptions](#BuilderOptions) | `false` | If it is a `boolean` type, whether to enable [electron-builder](https://www.electron.build). If it is an object, it is the [configuration](https://www.electron.build/configuration/configuration) of [electron-builder](https://www.electron.build). You can also turn it on using `process.env.VITE_ELECTRON_DEBUG`. |
| inspect | `boolean` | `false` | Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port. You can also use `process.env.VITE_ELECTRON_INSPECT`. See [debugging-main-process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process) for more information. |

**Notice**

The `recommended` option is used to set the default configuration and behavior, which can be used with almost zero configuration. The default is `true`. If you want to customize the configuration, set it to `false`. The following default prerequisites are to use the recommended [project structure](#directory-structure).

- Check whether `electron/main/index.ts` and `electron/main/index.ts` exist, and if so, assign values to `main.entry` and `preload.entry` respectively. If it does not exist, `main.entry` must be actively assigned, and an error will be reported.
- The output directory is based on the `build.outDir` parameter of `vite`, and outputs `electron/main`, `electron/preload` and `src` to `dist/main`, `dist/preload` and `dist/renderer` respectively.
- Other behaviors to be implemented

### MainOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| entry | `string` | `-` | The main process entry file. |
| format | `'cjs' \| 'esm'` | `-` | The bundle format. If not specified, it will use the "type" field from package.json. |
| outDir | `string` | "dist-electron/main" | The output directory for the main process files |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | A function that will be executed after the build succeeds. |

### PreloadOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| entry | `string` | `-` | The preload process entry file. |
| format | `'cjs' \| 'esm'` | `-` | The bundle format. If not specified, it will use the "type" field from package.json. |
| outDir | `string` | "dist-electron/preload" | The output directory for the preload process files |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | A function that will be executed after the build succeeds. |

### BuilderOptions

When `recommended` and `builder.enable` are both `true`, use [electron-builder](https://www.electron.build) to package Electron applications.

- In the `build.outDir` directory configured in vite, generate a new package.json based on the configuration and package.json, excluding non-dependencies.
- Execute `npm install` and then package.

_Not suitable for everyone._

To use this function, you need to install additional `electron-builder`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| appId | `string` | `"com.electron.${name}"` | The application id. [See More](https://www.electron.build/configuration/configuration#configuration) |
| productName | `string` | `"com.electron.${name}"` | product name.[See More](https://www.electron.build/configuration/configuration#configuration) |
| builderConfig | [Configuration](https://www.electron.build/configuration/configuration#configurationF) | `undefined` | [electron-builder](https://www.electron.build)'s [Configuration](https://www.electron.build/configuration/configuration#configuration) |

The default configuration is as follows:

```ts
const config = {
  directories: {
    buildResources: 'electron/build',
    app: path.dirname(resolvedConfig.build.outDir),
    output: 'release/${version}',
  },
  files: ['main', 'preload', 'renderer'],
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  electronDownload: {
    // when npm registry mirror is 'registry.npmmirror.com'
    mirror: 'https://npmmirror.com/mirrors/electron',
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
```

### Additional Information

- Default values for `main` and `preload` when the relevant parameters are not configured

| Parameter | Development Mode Default | Production Mode Default |
| --------- | ------------------------ | ----------------------- |
| sourcemap | `true`                   | `false`                 |
| minify    | `false`                  | `true`                  |

## Environment Variables

### Vite plugin variables

| Variable | Description |
| --- | --- |
| `VITE_ELECTRON_DEBUG` | Electron main process debug, don't startup electron. When value is true or 1 to enable, false or 0 to disable.Default is undefined. |
| `VITE_ELECTRON_INSPECT` | Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port. When value is true, the default port is 5858. |
| `VITE_ELECTRON_BUILDER` | Enable [electron-builder](https://www.electron.build) to package. When value is true or 1 to enable, false or 0 to disable. Default is undefined. |

### Application variables

Electron `main process` and `renderer process` use.

| Variable              | Description                |
| --------------------- | -------------------------- |
| `VITE_DEV_SERVER_URL` | The url of the dev server. |

## Debug

### Web debugging

Use [@tomjs/electron-devtools-installer](https://npmjs.com/package/@tomjs/electron-devtools-installer) to install the `Chrome Devtools` plugins and use it like web development

```ts
import { app } from 'electron';

app.whenReady().then(() => {
  const { installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = await import(
    '@tomjs/electron-devtools-installer'
  );

  installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
    .then(exts => {
      console.log(
        'Added Extension: ',
        exts.map(s => s.name),
      );
    })
    .catch(err => {
      console.log('Failed to install extensions');
      console.error(err);
    });
});
```

### Main Process Debug

Run `Debug Main Process` through `vscode` to debug the main thread. For debugging tools, refer to [Official Documentation](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` is configured as follows:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "preLaunchTask": "npm:debug",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outFiles": [
        "${workspaceFolder}/**/*.js",
        "${workspaceFolder}/**/*.cjs",
        "${workspaceFolder}/**/*.mjs",
        "!**/node_modules/**"
      ],
      "envFile": "${workspaceFolder}/node_modules/@tomjs/vite-plugin-electron/debug/.env"
    }
  ]
}
```

`tasks.json` is configured as follows:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "npm:debug",
      "type": "npm",
      "script": "debug",
      "detail": "cross-env VITE_ELECTRON_DEBUG=1 vite",
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^([a-zA-Z]\\:/?([\\w\\-]/?)+\\.\\w+):(\\d+):(\\d+): (ERROR|WARNING)\\: (.*)$",
          "file": 1,
          "line": 3,
          "column": 4,
          "code": 5,
          "message": 6
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*VITE v.*  ready in \\d* ms.*$",
          "endsPattern": "^.*\\[@tomjs:electron\\] startup electron*$"
        }
      }
    }
  ]
}
```

### Preload process Debug

Use `DevTools` to debug the `preload process`.

## Examples

First execute the following command to install dependencies and generate library files:

```bash
pnpm install
pnpm build
```

Open the [examples](./examples) directory, there are `vue` and `react` examples.

- [react](./examples/react)
- [vue](./examples/vue)
