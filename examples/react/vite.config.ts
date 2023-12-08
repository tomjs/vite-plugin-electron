import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
      },
      preload: {
        entry: 'electron/preload/index.ts',
      },
    }),
    renderer(),
  ],
});
