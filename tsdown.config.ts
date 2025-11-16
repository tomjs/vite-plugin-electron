import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/electron.ts'],
  format: ['es'],
  target: 'node20',
  external: ['electron'],
  clean: true,
  dts: true,
  publint: true,
});
