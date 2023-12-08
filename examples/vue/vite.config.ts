import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        minify: process.env.NODE_ENV === 'production',
      },
      preload: {
        entry: 'electron/preload/index.ts',
        minify: process.env.NODE_ENV === 'production',
      },
    }),
    renderer(),
  ],
});
