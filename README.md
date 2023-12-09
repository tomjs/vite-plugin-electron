# @tomjs/vite-plugin-electron

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-electron)](https://www.npmjs.com/package/@tomjs/vite-plugin-electron) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-electron) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-electron) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-electron)

**English** | [中文](./README.zh_CN.md)

> A Simple [vite](https://vitejs.dev/) plugin for [electron](https://www.electronjs.org), supports `esm` and `cjs`.

## Features

- Fast build `main` and `preload` with [tsup](https://github.com/egoist/tsup)
- Little configuration, focus on business
- Support `main`'s `Hot Restart`
- Support `preload`'s `Hot Reload`
- Support `esm` and `cjs`, you can use `esm` in [electron v28+](https://www.electronjs.org/blog/electron-28-0)
- Support `vue` and `react` and [other frameworks](https://vitejs.dev/guide/#trying-vite-online)

## Install

With `pnpm`

```bash
pnpm add @tomjs/vite-plugin-electron -D
```

With `yarn`

```bash
yarn add @tomjs/vite-plugin-electron -D
```

With `npm`

```bash
npm i @tomjs/vite-plugin-electron --save-dev
```

## Usage

### Project structure

- Recommended `electron` front-end code directory structure

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

- Use the default dist output directory of the plugin

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

For example, for vue/react projects, `vite.config.ts` configuration.

### vue

Support `ES modules`

- `package.json`

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
    electron({
      main: {
        entry: 'electron/main/index.ts',
      },
      preload: {
        entry: 'electron/preload/index.ts',
      },
    }),
    // renderer(),
  ],
});
```

### react

Support `CommonJS`

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
// import renderer from 'vite-plugin-electron-renderer'; // Enable nodeIntegration
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
      },
      preload: {
        entry: 'electron/preload/index.ts',
      },
    }),
    // renderer(),
  ],
});
```

## Documentation

- [paka.dev](https://paka.dev) 提供的 [API文档](https://paka.dev/npm/@tomjs/vite-plugin-electron).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-electron/dist/index.d.ts).

## Parameters

### PluginOptions

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | If set to true, it will change the main/preload/renderer outDir to be parallel outDir. For example, if vite build.outDir is 'dist', it will change main/preload/render to 'dist/main', 'dist/preload', and 'dist/renderer'. |
| external | `string[]` |  | List of modules that should not be bundled. |
| main | [MainOptions](#MainOptions) |  | Configuration options for the electron main process. |
| preload | [PreloadOptions](#PreloadOptions) |  | Configuration options for the electron preload process. |
| inspect | `boolean` | true | If set to true, electron will start with the `--inspect` flag. |

### MainOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | "main" | The name of the electron main process. |
| entry | `string` | `-` | The main process entry file. |
| format | `'cjs' \| 'esm'` | `-` | The bundle format. If not specified, it will use the "type" field from package.json. |
| outDir | `string` | "dist-electron/main" | The output directory for the main process files |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | A function that will be executed after the build succeeds. |

### PreloadOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | "preload" | The name of the electron preload process. |
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
