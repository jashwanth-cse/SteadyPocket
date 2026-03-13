'use strict';
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      // Use same JSON format so object payloads like logger.info({ event: 'x' })
      // are printed as readable JSON, not [object Object]
      format: winston.format.combine(
        winston.format.colorize({ message: false, level: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, timestamp, ...meta }) => {
          const msg = typeof meta.message === 'object'
            ? JSON.stringify(meta)
            : `${meta.message || ''} ${JSON.stringify(Object.fromEntries(
                Object.entries(meta).filter(([k]) => k !== 'message')
              ))}`;
          return `${timestamp} ${level}: ${msg}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
