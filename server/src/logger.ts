import pino from 'pino';

export function createLogger(nodeEnv: string) {
  return pino({
    level: nodeEnv === 'production' ? 'info' : 'debug',
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['req.headers.authorization']
  });
}
