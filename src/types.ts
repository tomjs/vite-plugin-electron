import type { Configuration } from 'electron-builder';
import type { UserConfig as Options } from 'tsdown';

/**
 * Electron main process options. See [tsup](https://tsup.egoist.dev/) and [API Doc](https://www.jsdocs.io/package/tsup) for more information.
 * @see https://www.jsdocs.io/package/tsup
 * @see https://unpkg.com/browse/tsup/dist/index.d.ts
 */
export interface MainOptions
  extends Omit<Options, 'entry' | 'format' | 'outDir' | 'watch'> {
  /**
   * The main process entry file.
   */
  entry?: string;
  /**
   * The bundle format. If not specified, it will use the "type" field from package.json.
   */
  format?: 'cjs' | 'esm';
  /**
   * The output directory for the main process files. Defaults to `"dist-electron/main"`.
   * @default "dist-electron/main"
   */
  outDir?: string;
  /**
   * `tsdown` watches the current working directory by default. You can set files that need to be watched, which may improve performance.
   *
   * If no value is specified, the default value of the "recommended" parameter is ["dist-electron"] when it is true, otherwise 'watch' defaults to "true"
   */
  watchFiles?: string | string[];
}

/**
 * Electron preload process options. See [tsup](https://tsup.egoist.dev/) and [API Doc](https://www.jsdocs.io/package/tsup) for more information.
 * @see https://www.jsdocs.io/package/tsup
 * @see https://unpkg.com/browse/tsup/dist/index.d.ts
 */
export interface PreloadOptions
  extends Omit<Options, 'entry' | 'format' | 'outDir' | 'watch'> {
  /**
   * The preload process entry file
   */
  entry?: string | string[] | Record<string, string>;
  /**
   * The bundle format. If not specified, it will use the "type" field from package.json.
   */
  format?: 'cjs' | 'esm';
  /**
   * The output directory for the preload process files. Defaults is `"dist-electron/preload"`.
   * @default "dist-electron/preload"
   */
  outDir?: string;
  /**
   * `tsdown` watches the current working directory by default. You can set files that need to be watched, which may improve performance.
   *
   * If no value is specified, the default value of the "recommended" parameter is ["dist-electron"] when it is true, otherwise 'watch' defaults to "true"
   */
  watchFiles?: string | string[];
}

/**
 * When `recommended` and `builder.enable` are both `true`, use [electron-builder](https://www.electron.build) to package Electron applications.
 *
 * In the `build.outDir` directory configured in vite, generate a new package.json based on the configuration and package.json, excluding non-dependencies.
 * Execute `npm install` and then package.
 */
export interface BuilderOptions {
  /**
   * The application id. Used as [CFBundleIdentifier](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102070) for MacOS and as
   * [Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) for Windows (NSIS target only, Squirrel.Windows not supported). It is strongly recommended that an explicit ID is set.
   * @default com.electron.${name}
   */
  appId?: string | null;
  /**
   * As [name](#Metadata-name), but allows you to specify a product name for your executable which contains spaces and other special characters not allowed in the [name property](https://docs.npmjs.com/files/package.json#name).
   * If not specified inside of the `build` configuration, `productName` property defined at the top level of `package.json` is used. If not specified at the top level of `package.json`, [name property](https://docs.npmjs.com/files/package.json#name) is used.
   */
  productName?: string | null;
  /**
   * The [electron-builder](https://www.electron.build/configuration/configuration) configuration.
   */
  builderConfig?: Configuration;
}

/**
 * vite plugin options
 */
export interface PluginOptions {
  /**
   * Recommended switch. Default is true.
   * if true, will have the following default behavior:
   * will change the main/preload/renderer outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change main/preload/render to 'dist/main' and 'dist/preload' and 'dist/renderer'
   * @default true
   */
  recommended?: boolean;
  /**
   * Don't bundle these modules, but dependencies and peerDependencies in your package.json are always excluded. [See more](https://tsup.egoist.dev/#excluding-packages)
   * @see https://tsup.egoist.dev/#excluding-packages
   */
  external?: (string | RegExp)[];
  /**
   * electron main process options
   */
  main?: MainOptions;
  /**
   * electron preload process options
   */
  preload?: PreloadOptions;
  /**
   * When `recommended` and `builder.enable` are both `true`, use [electron-builder](https://www.electron.build) to package Electron applications.
   *
   * In the `build.outDir` directory configured in vite, generate a new package.json based on the configuration and package.json, excluding non-dependencies.
   * Execute `npm install` and then package.
   */
  builder?: boolean | BuilderOptions;
  /**
   * electron debug mode, don't startup electron. You can also use `process.env.VITE_ELECTRON_DEBUG`. Default is false.
   * @default false
   */
  debug?: boolean;
  /**
   * Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port.
   * You can also use `process.env.VITE_ELECTRON_INSPECT`. See [debugging-main-process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process) for more information.
   * The default port is false.
   * @see https://www.electronjs.org/docs/latest/tutorial/debugging-main-process
   * @default false
   */
  inspect?: number | boolean;
}
