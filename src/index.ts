import type { Plugin } from 'vite';

interface PluginOptions {
  main?: any;
  preload?: any;
}

export function useElectronPlugin(_options: PluginOptions): Plugin {
  return {
    name: '@tomjs:electron',
  };
}

export default useElectronPlugin;
