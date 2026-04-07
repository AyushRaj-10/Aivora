import winston from 'winston';
import config from '../config/index.js';
import util from 'util';

const logger = winston.createLogger({
  level: config.server.env === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaStr = '';
      if (Object.keys(meta).length) {
        try {
          metaStr = ` ${JSON.stringify(meta)}`;
        } catch (e) {
          metaStr = ` ${util.inspect(meta, { depth: 2 })}`;
        }
      }
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;