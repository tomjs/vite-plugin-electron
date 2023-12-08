import type { Options as TsupOptions } from 'tsup';

/**
 * Electron main process options
 */
export type MainOptions = Omit<
  TsupOptions,
  'name' | 'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess'
> & {
  /**
   * main output folder name
   * @default "main"
   */
  name?: string;
  /**
   * main entry file
   */
  entry: string;
  /**
   * bundle format. if not specified, will use package.json "type" field
   */
  format?: 'cjs' | 'esm';
  /**
   * preload outDir
   * @default "dist-electron/main"
   */
  outDir?: string;
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
};

/**
 * Electron preload process options
 */
export type PreloadOptions = Omit<
  TsupOptions,
  'name' | 'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess'
> & {
  /**
   * preload output folder name
   * @default "preload"
   */
  name?: string;
  entry?: string | string[] | Record<string, string>;
  format?: 'cjs' | 'esm';
  /**
   * preload outDir
   * @default "dist-electron/preload"
   */
  outDir?: string;
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
};

export interface PluginOptions {
  /**
   * If true, will change the main/preload/renderer outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change main/preload/render to 'dist/main' and 'dist/preload' and 'dist/renderer'
   * @default true
   */
  parallelOutDir?: boolean;
  /**
   * Don't bundle these modules
   */
  external?: string[];
  /**
   * electron main process options
   */
  main: MainOptions;
  /**
   * electron preload process options
   */
  preload?: PreloadOptions;
  /**
   * electron start with the `--inspect`
   */
  inspect?: boolean;
}

/**
 * Only used internally
 */
export interface InnerOptions {
  /**
   * whether is vite server
   */
  isServer?: boolean;
  /**
   * vite server url, will be passed to electron
   */
  serverUrl?: string;
  /**
   * renderer outDir
   */
  rendererOutDir?: string;
  /**
   * electron main entry file
   */
  mainFile?: string;
}
