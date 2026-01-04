import Logger from '@tomjs/logger';
import { PLUGIN_NAME } from './constants';

export function createLogger(tag?: string) {
  return new Logger({
    prefix: tag || `[${PLUGIN_NAME}]`,
    time: true,
  });
}
