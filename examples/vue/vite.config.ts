import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [vue(), electron({ builder: true }), renderer()],
});
