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
    /**
     * Electron will listen for V8 inspector protocol messages on the specified port, an external debugger will need to connect on this port. The default port is 5858.
     */
    APP_ELECTRON_INSPECT?: string;
  }
}
