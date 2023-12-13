import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from 'node:child_process';
import fs from 'node:fs';
import { builtinModules } from 'node:module';

export function readJson(path: string) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
}
export function writeJson(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

export const getNodeExternal = (externals?: string[]) => {
  const modules = builtinModules.filter(
    x => !/^_|^(internal|v8|node-inspect|fsevents)\/|\//.test(x),
  );

  const external = Array.isArray(externals) ? externals : [];

  return [
    ...new Set(modules.concat(modules.map(s => `node:${s}`)).concat(['electron', ...external])),
  ];
};

export function exec(
  command: string,
  args: string[] = [],
  options?: SpawnSyncOptionsWithStringEncoding,
) {
  return spawnSync(command, args, Object.assign({ encoding: 'utf8' }, options));
}
