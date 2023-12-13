import os from 'node:os';
import fs from 'fs-extra';

console.log('Electron Preload Process!');
console.log(os.homedir(), fs.pathExistsSync(os.homedir()));
