/**
 * fix code hint
 */
type UnionType<T> = T | (string & {});

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Node.js environment
     */
    NODE_ENV: UnionType<'development' | 'test' | 'production'>;
    /**
     * The url of the dev server.
     */
    APP_DEV_SERVER_URL?: string;
    /**
     * Electron main process debug, don't startup electron
     */
    APP_ELECTRON_DEBUG?: string;
  }
}
