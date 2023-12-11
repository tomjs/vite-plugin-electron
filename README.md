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

## Install

```bash
# pnpm
pnpm add @tomjs/vite-plugin-electron -D

# yarn
yarn add @tomjs/vite-plugin-electron -D

# npm
npm i @tomjs/vite-plugin-electron --save-dev
```

## Usage

### Recommended Agreement

#### Directory Structure

- Recommend `electron` and page `src` code directory structure

```
|--electron
|  |--main
|  |  |--index.ts
|  |--preload
|  |  |--index.ts
|--src
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
const url = process.env.APP_DEV_SERVER_URL;

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

Electron preload must use the `mjs` suffix, otherwise an error will be reported. So `esm` also uses the `mjs` suffix for output by default.

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
| debug | `boolean` | `false` | Electron debug mode, don't startup electron. You can also use `process.env.APP_ELECTRON_DEBUG`. Default is false. |
| inspect | `boolean` | `false` | Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port. You can also use `process.env.APP_ELECTRON_INSPECT`. See [debugging-main-process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process) for more information. |

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

### Additional Information

- Default values for `main` and `preload` when the relevant parameters are not configured

| Parameter | Development Mode Default | Production Mode Default |
| --------- | ------------------------ | ----------------------- |
| sourcemap | `true`                   | `false`                 |
| minify    | `false`                  | `true`                  |

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

### Main thread debugging

#### Turn on debugging

Start code compilation through the following configuration or `ELECTRON_DEBUG=1 vite dev`

- Enable by setting `APP_ELECTRON_DEBUG=1` in `.env.development` file
- `vite.config.js` configures `electron({ debug: true })` to be turned on

#### VSCODE

Run `Debug Main Process` through `vscode` to debug the main thread. For debugging tools, refer to [Official Documentation](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` is configured as follows:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceRoot}",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "envFile": "${workspaceRoot}/node_modules/@tomjs/vite-plugin-electron/debug/.env"
    }
  ]
}
```
