# @tomjs/vite-plugin-electron

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-electron)](https://www.npmjs.com/package/@tomjs/vite-plugin-electron) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-electron) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-electron) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-electron)

> 一个简单的 [electron](https://www.electronjs.org/zh/) [vite](https://cn.vitejs.dev/) 插件，支持 `esm` 和 `cjs`

[English](./README.md) | **中文**

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

### 项目结构

- 推荐 `electron` 的 前端代码目录结构

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

- 使用插件默认 dist 输出目录

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

以 vue/react 项目为例，`vite.config.ts` 配置。

### vue

支持 `ES modules`

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
// import renderer from 'vite-plugin-electron-renderer'; // 启用 nodeIntegration
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

支持 `CommonJS`

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
// import renderer from 'vite-plugin-electron-renderer'; // 启用 nodeIntegration
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

## 文档

- [paka.dev](https://paka.dev) 提供的 [API文档](https://paka.dev/npm/@tomjs/vite-plugin-electron).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-electron/dist/index.d.ts).

## 参数

### PluginOptions

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | 推荐开关，如果为true，将具有以下默认行为：将main/preload/renderer的outDir更改为并行的outDir；例如，如果vite build.outDir为'dist'，将main/preload/render更改为'dist/main'、'dist/preload'和'dist/renderer' |
| external | `string[]` |  | 不打包这些模块 |
| **main** | [MainOptions](#MainOptions) |  | electron main 进程选项 |
| preload | [PreloadOptions](#PreloadOptions) |  | electron preload 进程选项 |
| inspect | `boolean` | `true` | electron启动时使用`--inspect`参数 |

### MainOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| name | `string` | "main" | main 名称 |
| **entry** | `string` | `-` | main 入口文件 |
| format | `'cjs' \| 'esm'` | `-` | 打包格式。如果未指定，将使用 package.json 中的 "type" 字段 |
| outDir | `string` | `"dist-electron/main"` | main 输出文件夹 |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | 构建成功后运行的回调函数 |

### PreloadOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| name | `string` | "preload" | preload 名称 |
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
