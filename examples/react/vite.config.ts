import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    electron({
      external: ['fs-extra', 'simple-git'],
      builder: {
        enable: true,
      },
    }),
    renderer(),
  ],
});
