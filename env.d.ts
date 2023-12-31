/**
 * fix code hint
 */
type UnionType<T> = T | (string & {});

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Node.js environment
     */
    NODE_ENV: UnionType<'development' | 'production' | 'test'>;
    /**
     * The url of the dev server.
     */
    VITE_DEV_SERVER_URL?: string;
  }
}
