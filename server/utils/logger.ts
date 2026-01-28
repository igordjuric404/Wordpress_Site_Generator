import pino from 'pino';

// Redact sensitive fields
const redactPaths = [
  'password',
  'adminPassword',
  'ANTHROPIC_API_KEY',
  'MYSQL_PASSWORD',
  'apiKey',
  'secret',
  'token',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
});

// Child logger factory for service-specific logging
export function createServiceLogger(service: string) {
  return logger.child({ service });
}
