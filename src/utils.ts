import type { AddressInfo } from 'node:net';
import type { ViteDevServer } from 'vite';
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

export function getNodeExternal(externals?: string[]) {
  const modules = builtinModules.filter(
    x => !/^_|^(?:internal|v8|node-inspect|fsevents)\/|\//.test(x),
  );

  const external = Array.isArray(externals) ? externals : [];

  return [
    ...new Set(modules.concat(modules.map(s => `node:${s}`)).concat(['electron', ...external])),
  ];
}

/**
 * @see https://github.com/vitejs/vite/blob/v4.0.1/packages/vite/src/node/constants.ts#L137-L147
 */
export function resolveHostname(hostname: string) {
  const loopbackHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '0000:0000:0000:0000:0000:0000:0000:0001',
  ]);
  const wildcardHosts = new Set(['0.0.0.0', '::', '0000:0000:0000:0000:0000:0000:0000:0000']);

  return loopbackHosts.has(hostname) || wildcardHosts.has(hostname) ? 'localhost' : hostname;
}

export function resolveServerUrl(server: ViteDevServer) {
  const addressInfo = server.httpServer!.address();
  const isAddressInfo = (x: any): x is AddressInfo => x?.address;

  if (isAddressInfo(addressInfo)) {
    const { address, port } = addressInfo;
    const hostname = resolveHostname(address);

    const options = server.config.server;
    const protocol = options.https ? 'https' : 'http';
    const devBase = server.config.base;

    const path = typeof options.open === 'string' ? options.open : devBase;
    const url = path.startsWith('http') ? path : `${protocol}://${hostname}:${port}${path}`;

    return url;
  }
}
