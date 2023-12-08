import fs from 'node:fs';
import { builtinModules } from 'node:module';

export function readJson(path: string) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
}

export const getNodeExternal = () => {
  const modules = builtinModules.filter(
    x => !/^_|^(internal|v8|node-inspect|fsevents)\/|\//.test(x),
  );

  return modules.concat(['electron']).concat(modules.map(s => `node:${s}`));
};
