# @tomjs/vite-plugin-electron

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-electron)](https://www.npmjs.com/package/@tomjs/vite-plugin-electron) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-electron) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-electron) [![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue)](https://www.jsdocs.io/package/@tomjs/vite-plugin-electron)

[English](./README.md) | **中文**

> 一个简单的 [electron](https://www.electronjs.org/zh/) [vite](https://cn.vitejs.dev/) 插件，支持 `esm` 和 `cjs`

非常感谢 [caoxiemeihao](https://github.com/caoxiemeihao) 的 [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) 和 [Doubleshotjs](https://github.com/Doubleshotjs) 的 [doubleshot](https://github.com/Doubleshotjs/doubleshot) 这两个优秀库给了我启发。我希望使用它能简化开发配置，只关注业务开发。

## 特性

- 使用 [tsup](https://github.com/egoist/tsup) 快速构建 `main` 和 `preload`
- 配置简单，专注业务
- 支持 `main` 的 `热重启`
- 支持 `preload` 的 `热重载`
- 支持 `esm` 和 `cjs` ，你可以在 [electron v28+](https://www.electronjs.org/zh/blog/electron-28-0) 中使用 `esm`
- 支持 `vue` 和 `react` 等其他 `vite` 支持的[框架](https://cn.vitejs.dev/guide/#trying-vite-online)
- 可选 [electron-builder](https://www.electron.build/) 简单配置打包

## 安装

```bash
# pnpm
pnpm add @tomjs/vite-plugin-electron -D

# yarn
yarn add @tomjs/vite-plugin-electron -D

# npm
npm i @tomjs/vite-plugin-electron --save-dev
```

如果使用 `builder` 打包应用，请安装 `electron-builder`

```bash
# pnpm
pnpm add electron-builder -D

# yarn
yarn add electron-builder -D

# npm
npm i electron-builder --save-dev
```

## 使用说明

### 推荐约定

#### 目录结构

- 推荐 `electron` 和 页面 `src` 代码目录结构

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
globalThis.__dirname = dirname(fileURLToPath(import.meta.url));

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
  }
  else {
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(createWindow);
```

### vue

以使用 `esm` 为例，不过要求 `Electron>=28`

- `package.json`

Electron `preload process` 必须使用 `.mjs` 后缀，否则报错，查看[官方文档](https://www.electronjs.org/zh/docs/latest/tutorial/esm)。所以 `preload` 的 `esm` 默认输出使用 `mjs` 后缀。为了保持一致性，`main process` 也以 `.mjs` 结尾。

```json
{
  "type": "module",
  "main": "dist/main/index.mjs"
}
```

- `vite.config.ts`

```ts
// import renderer from 'vite-plugin-electron-renderer'; // 启用 nodeIntegration
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

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
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), electron()],
});
```

## 文档

- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-electron/dist/index.d.ts).

## 参数

### PluginOptions

| 参数名      | 类型                              | 默认值  | 说明                                                                                                                                                                                                                                                                      |
| ----------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| recommended | `boolean`                         | `true`  | 这个选项是为了提供推荐的默认参数和行为                                                                                                                                                                                                                                    |
| external    | `string[]`                        |         | 不打包这些模块，但是 `dependencies` and `peerDependencies` 默认排除，[详见](https://tsup.egoist.dev/#excluding-packages)                                                                                                                                                  |
| main        | [MainOptions](#MainOptions)       |         | electron main 进程选项                                                                                                                                                                                                                                                    |
| preload     | [PreloadOptions](#PreloadOptions) |         | electron preload 进程选项                                                                                                                                                                                                                                                 |
| debug       | `boolean`                         | `false` | Electron调试模式，不启动Electron。 您还可以使用 `process.env.VITE_ELECTRON_DEBUG`                                                                                                                                                                                         |
| builder     | `boolean`                         | `false` | 如果是`boolean`类型，是否启用[electron-builder](https://www.electron.build)。如果是`Object`，则是[electron-builder](https://www.electron.build)的[配置](https://www.electron.build/configuration/configuration)。 您还可以使用 `process.env.VITE_ELECTRON_DEBUG` 开启它。 |
| inspect     | `boolean`                         | `false` | Electron 将监听指定 port 上的 V8 调试协议消息， 外部调试器需要连接到此端口上。您还可以使用 `process.env.VITE_ELECTRON_INSPECT`。 有关更多信息，请参阅[debugging-main-process](https://www.electronjs.org/zh/docs/latest/tutorial/debugging-main-process)。                |

`recommended` 选项用于设置默认配置和行为，几乎可以达到零配置使用，默认为 `true` 。如果你要自定义配置，请设置它为`false`。以下默认的前提条件是使用推荐的 [项目结构](#目录结构)。

- 检查是否存在 `electron/main/index.ts` 和 `electron/main/index.ts`，如果有则分别给 `main.entry` 和 `preload.entry` 赋值。如果不存在，`main.entry` 必须主动赋值，负责会报错
- 输出目录根据 `vite` 的 `build.outDir` 参数， 将 `electron/main`、`electron/preload`、`src` 分别输出到 `dist/main`、`dist/preload`、`dist/renderer`
- 其他待实现的行为

### MainOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://www.jsdocs.io/package/tsup)，添加了一些默认值，方便使用。

| 参数名    | 类型                                                                | 默认值                 | 说明                                                       |
| --------- | ------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| **entry** | `string`                                                            | `-`                    | main 入口文件                                              |
| format    | `'cjs' \| 'esm'`                                                    | `-`                    | 打包格式。如果未指定，将使用 package.json 中的 "type" 字段 |
| outDir    | `string`                                                            | `"dist-electron/main"` | main 输出文件夹                                            |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined`            | 构建成功后运行的回调函数                                   |

### PreloadOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://www.jsdocs.io/package/tsup)，添加了一些默认值，方便使用。

| 参数名    | 类型                                                                | 默认值                    | 说明                                                       |
| --------- | ------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| **entry** | `string`                                                            | `-`                       | preload 入口文件                                           |
| format    | `'cjs' \| 'esm'`                                                    | `-`                       | 打包格式。如果未指定，将使用 package.json 中的 "type" 字段 |
| outDir    | `string`                                                            | `"dist-electron/preload"` | preload 输出文件夹                                         |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined`               | 构建成功后运行的回调函数                                   |

### BuilderOptions

当 `recommended` 和 `builder.enable` 都为 `true` 时，使用 [electron-builder](https://www.electron.build) 打包 Electron 应用程序。

- 在vite中配置的`build.outDir`目录中，根据配置和package.json生成新的package.json，排除非依赖项。
- 执行`npm install`然后打包。

_不适合所有人使用。_

使用该功能，需要额外安装 `electron-builder`

| 参数名        | 类型                                                                                   | 默认值                   | 说明                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| appId         | `string`                                                                               | `"com.electron.${name}"` | 应用程序 ID。[详细](https://www.electron.build/configuration/configuration#configuration)                                               |
| productName   | `string`                                                                               | ``                       | 应用程序名称。[详细](https://www.electron.build/configuration/configuration#configuration)                                              |
| builderConfig | [Configuration](https://www.electron.build/configuration/configuration#configurationF) | `undefined`              | [electron-builder](https://www.electron.build) 的 [Configuration](https://www.electron.build/configuration/configuration#configuration) |

默认配置如下

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

### 补充说明

- `main` 和 `preload` 未配置相关参数时的默认值

| 参数      | 开发模式默认值 | 生产模式默认值 |
| --------- | -------------- | -------------- |
| sourcemap | `true`         | `false`        |
| minify    | `false`        | `true`         |

## 环境变量

### vite 插件变量

| 变量                    | 描述                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ELECTRON_DEBUG`   | Electron主进程调试，不要启动Electron。 当值为 true 或 1 时启用，为 false 或 0 时禁用。默认值未定义。                            |
| `VITE_ELECTRON_INSPECT` | Electron 将在指定端口上侦听 V8 检查器协议消息，外部调试器需要连接到该端口。 当值为 true 时，默认端口为 5858。                   |
| `VITE_ELECTRON_BUILDER` | 启用 [ Electron-builder ](https://www.electron.build) 进行打包。 当值为 true 或 1 时启用，为 false 或 0 时禁用。 默认值未定义。 |

### 应用变量

Electron `main process` 和 `renderer process` 使用。

| 变量                  | 描述                  |
| --------------------- | --------------------- |
| `VITE_DEV_SERVER_URL` | Vite 开发服务器的 URL |

## 调试

### Web调试

使用 [@tomjs/electron-devtools-installer](https://npmjs.com/package/@tomjs/electron-devtools-installer) 安装 `Chrome Devtools` 插件后像 Web 开发一样使用

```ts
import { app } from 'electron';

app.whenReady().then(() => {
  const { installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = await import(
    '@tomjs/electron-devtools-installer'
  );

  installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
    .then((exts) => {
      console.log(
        'Added Extension: ',
        exts.map(s => s.name),
      );
    })
    .catch((err) => {
      console.log('Failed to install extensions');
      console.error(err);
    });
});
```

### Main Process 调试

通过 `vscode` 运行 `Debug Main Process` 调试主线程，调试工具参考 [官方文档](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` 配置如下：

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

`tasks.json` 配置如下：

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
          "endsPattern": "^.*\\[tomjs:electron\\] startup electron*$"
        }
      }
    }
  ]
}
```

### Preload Process 调试

使用 `DevTools` 调试 `preload process`.

## 示例

先执行以下命令安装依赖，并生成库文件：

```bash
pnpm install
pnpm build
```

打开 [examples](./examples) 目录，有 `vue` 和 `react` 示例。

- [react](./examples/react)
- [vue](./examples/vue)
