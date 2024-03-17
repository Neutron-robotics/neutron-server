/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
import Transport from 'winston-transport';

/**
 * https://stackoverflow.com/a/41407246
 * Log level escpace codes
 */
const levelStyleMap: { [key: string]: string } = {
  error: '\x1b[41m%s\x1b[0m',
  warn: '\x1b[33m%s\x1b[0m',
  info: '\x1b[94m%s\x1b[0m',
  verbose: '\x1b[35m%s\x1b[0m',
  debug: '\x1b[32m%s\x1b[0m',
  silly: '\x1b[36m%s\x1b[0m'
};

const formatLog = (label: string, info: any) => {
  const date = new Date().toISOString();

  console.log(label, info);

  if (label === 'API') return `[${date}] [${label}] - ${info.method} user:${info.userId} - ${info.statusCode} - ${info.duration}ms ${info.path} ${info.message}`;
  return `[${date}] [${label}] ${info.message}`;
};

export default class ConsoleLogTransport extends Transport {
  log(info: any, callback: { (): void }) {
    const label = info?.label || (info.level as string).toUpperCase();
    const finalMessage = formatLog(label, info);
    console.log(levelStyleMap[info.level], finalMessage);
    info.stack && console.log('\t', info.stack);
    callback();
  }
}
