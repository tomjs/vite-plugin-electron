import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron({
      external: ['fs-extra'],
    }),
    renderer(),
  ],
});
