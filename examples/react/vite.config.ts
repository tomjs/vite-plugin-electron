import { defineConfig } from 'vite';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), electron({})],
});
