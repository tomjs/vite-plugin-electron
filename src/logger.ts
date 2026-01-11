import type { LogLevel, LogOptions } from 'vite';
import { createLogger as _createLogger } from 'vite';
import { PLUGIN_NAME } from './constants';

export function createLogger(logLevel?: LogLevel) {
  const logger = _createLogger(logLevel, {
    prefix: `[${PLUGIN_NAME}]`,
    allowClearScreen: true,
  });

  ['info', 'warn', 'warnOnce', 'error'].forEach((level) => {
    const _level = logger[level];
    logger[level] = (msg: string, options?: LogOptions) => {
      _level(msg, Object.assign({ timestamp: true, clear: false } as LogOptions, options));
    };
  });
  return logger;
}

export const logger = createLogger();
