import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/electron.ts'],
  format: ['es'],
  target: 'node20',
  deps: {
    neverBundle: ['electron'],
  },
  clean: true,
  dts: true,
  publint: true,
});
