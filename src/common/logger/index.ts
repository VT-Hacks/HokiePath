import { pinoHttp } from 'pino-http';
import pino from 'pino';

export const logger = pino({
  level: 'info',
  base: {
    name: 'Hokie Path',
  },
  serializers: pino.stdSerializers,
  timestamp: () => `, "time" : "${new Date(Date.now()).toISOString()}"`,
  transport: {
    target: 'pino-pretty',
    level: 'error',
  },
});
export const httpLogger = pinoHttp({
  logger,
  level: 'error',
});
