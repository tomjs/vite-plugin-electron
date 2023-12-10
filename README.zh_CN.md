# @tomjs/vite-plugin-electron

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-electron)](https://www.npmjs.com/package/@tomjs/vite-plugin-electron) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-electron) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-electron) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-electron)

[English](./README.md) | **中文**

> 一个简单的 [electron](https://www.electronjs.org/zh/) [vite](https://cn.vitejs.dev/) 插件，支持 `esm` 和 `cjs`

学习了 [caoxiemeihao](https://github.com/caoxiemeihao) 的 [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) 和 [Doubleshotjs](https://github.com/Doubleshotjs) 的 [doubleshot](https://github.com/Doubleshotjs/doubleshot) 这两个优秀的作品，结合自己的一些想法，开发了该插件。希望使用它能简化开发配置，只关注业务开发。

## 特性

- 使用 [tsup](https://github.com/egoist/tsup) 快速构建 `main` 和 `preload`
- 配置简单，专注业务
- 支持 `main` 的 `热重启`
- 支持 `preload` 的 `热重载`
- 支持 `esm` 和 `cjs` ，你可以在 [electron v28+](https://www.electronjs.org/zh/blog/electron-28-0) 中使用 `esm`
- 支持 `vue` 和 `react` 以及 [其他框架](https://cn.vitejs.dev/guide/#trying-vite-online)

## 安装

使用 `pnpm`

```bash
pnpm add @tomjs/vite-plugin-electron -D
```

使用 `yarn`

```bash
yarn add @tomjs/vite-plugin-electron -D
```

使用 `npm`

```bash
npm i @tomjs/vite-plugin-electron --save-dev
```

## 使用说明

### 推荐约定

#### 目录结构

- 推荐 `electron` 和 页面 `src` 代码目录结构

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

- 零配置，默认 dist 输出目录

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

#### 默认配置和行为

详细查看 [PluginOptions](#pluginoptions) 和 `recommended` 参数说明

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

以使用 `esm` 为例，不过要求 `Electron>=28`

- `package.json`

Electron preload 必须使用 `mjs` 后缀，否则报错。所以 `esm` 也默认输出使用 `mjs` 后缀。

```json
{
  "type": "module",
  "main": "dist/main/index.mjs"
}
```

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
// import renderer from 'vite-plugin-electron-renderer'; // 启用 nodeIntegration
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    // 如使用约定的目录结构，则不需要配置
    electron(),
    // 如果自定义了目录结构，则必须根据实际情况赋值
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

以使用 `cjs` 为例

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

## 文档

- [paka.dev](https://paka.dev) 提供的 [API文档](https://paka.dev/npm/@tomjs/vite-plugin-electron).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-electron/dist/index.d.ts).

## 参数

### PluginOptions

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | 推荐开关，如果为true，将具有以下默认行为：将main/preload/renderer的outDir更改为并行的outDir；例如，如果vite build.outDir为'dist'，将main/preload/render更改为'dist/main'、'dist/preload'和'dist/renderer' |
| external | `string[]` |  | 不打包这些模块 |
| main | [MainOptions](#MainOptions) |  | electron main 进程选项 |
| preload | [PreloadOptions](#PreloadOptions) |  | electron preload 进程选项 |
| inspect | `boolean` | `true` | electron启动时使用`--inspect`参数 |

`recommended` 选项用于设置默认配置和行为，几乎可以达到零配置使用，默认为 `true` 。如果你要自定义配置，请设置它为`false`。以下默认的前提条件是使用推荐的 [项目结构](#目录结构)。

- 检查是否存在 `electron/main/index.ts` 和 `electron/main/index.ts`，如果有则分别给 `main.entry` 和 `preload.entry` 赋值。如果不存在，`main.entry` 必须主动赋值，负责会报错
- 输出目录根据 `vite` 的 `build.outDir` 参数， 将 `electron/main`、`electron/preload`、`src` 分别输出到 `dist/main`、`dist/preload`、`dist/renderer`
- 其他待实现的行为

### MainOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **entry** | `string` | `-` | main 入口文件 |
| format | `'cjs' \| 'esm'` | `-` | 打包格式。如果未指定，将使用 package.json 中的 "type" 字段 |
| outDir | `string` | `"dist-electron/main"` | main 输出文件夹 |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | 构建成功后运行的回调函数 |

### PreloadOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **entry** | `string` | `-` | preload 入口文件 |
| format | `'cjs' \| 'esm'` | `-` | 打包格式。如果未指定，将使用 package.json 中的 "type" 字段 |
| outDir | `string` | `"dist-electron/preload"` | preload 输出文件夹 |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | 构建成功后运行的回调函数 |

### 补充说明

- `main` 和 `preload` 未配置相关参数时的默认值

| 参数      | 开发模式默认值 | 生产模式默认值 |
| --------- | -------------- | -------------- |
| sourcemap | `true`         | `false`        |
| minify    | `false`        | `true`         |
