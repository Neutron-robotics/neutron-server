import {
  createLogger,
  format,
  transports
} from 'winston';
import dotenv from 'dotenv';
import ConsoleLoggerTransport from './lib/winston-console-transport';

const LogstashTransport = require('winston-logstash/lib/winston-logstash-latest');

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env.default' });
}

const logTransports = [
  new transports.File({
    level: 'error',
    filename: './logs/error.log',
    format: format.json({
      replacer: (key, value) => {
        if (key === 'error') {
          return {
            message: (value as Error).message,
            stack: (value as Error).stack
          };
        }
        return value;
      }
    })
  }),
  new ConsoleLoggerTransport()
];

if (process.env.LOGSTASH_IS_ENABLED) {
  logTransports.push(new LogstashTransport({
    port: +(process.env.LOGSTASH_PORT as string),
    node_name: process.env.LOGSTASH_NODE_NAME as string,
    host: process.env.LOGSTASH_HOSTNAME as string
  }));
}

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
  ),
  transports: logTransports,
  level: process.env.NODE_ENV === 'development' ? 'silly' : 'info'
});

export default logger;
