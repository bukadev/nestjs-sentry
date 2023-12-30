import { SentryModuleOptions } from '../../interfaces';

export const createSentryModuleOptions = (
  moduleOptions?: Partial<SentryModuleOptions>,
): SentryModuleOptions => {
  return {
    dsn: 'https://45740e3ae4864e77a01ad61a47ea3b7e@o115888.ingest.sentry.io/25956308132020',
    debug: true,
    environment: 'test',
    loggerOptions: {
      logLevels: ['debug'],
    },
    ...moduleOptions,
  };
};
