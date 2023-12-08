import { dirname } from 'path';
import { fileURLToPath } from 'url';

global.__dirname = dirname(fileURLToPath(import.meta.url));
