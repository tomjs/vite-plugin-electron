import type { Options } from 'tsup';

/**
 * Electron main process options. See [tsup](https://tsup.egoist.dev/) and [API Doc](https://paka.dev/npm/tsup) for more information.
 * @see https://paka.dev/npm/tsup
 * @see https://unpkg.com/browse/tsup/dist/index.d.ts
 */
export interface MainOptions
  extends Omit<Options, 'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess'> {
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
   * A function that will be executed after the build succeeds.
   */
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
}

/**
 * Electron preload process options. See [tsup](https://tsup.egoist.dev/) and [API Doc](https://paka.dev/npm/tsup) for more information.
 * @see https://paka.dev/npm/tsup
 * @see https://unpkg.com/browse/tsup/dist/index.d.ts
 */
export interface PreloadOptions
  extends Omit<Options, 'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess'> {
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
   * A function that will be executed after the build succeeds.
   */
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
}

/**
 * vite plugin options
 */
export interface PluginOptions {
  /**
   * Recommended switch. Default is true.
   * if true, will have the following default behavior:
   * * will change the main/preload/renderer outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change main/preload/render to 'dist/main' and 'dist/preload' and 'dist/renderer'
   * @default true
   */
  recommended?: boolean;
  /**
   * Don't bundle these modules
   */
  external?: string[];
  /**
   * electron main process options
   */
  main?: MainOptions;
  /**
   * electron preload process options
   */
  preload?: PreloadOptions;
  /**
   * electron start with the `--inspect`
   * @default true
   */
  inspect?: boolean;
}
