import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
