import { Provider } from '@nestjs/common';
import { SENTRY_MODULE_OPTIONS, SENTRY_TOKEN } from './sentry.tokens';
import { SentryService } from './sentry.service';
import { SentryModuleOptions } from './interfaces';

export function createSentryProvider(options: SentryModuleOptions): Provider {
  return {
    provide: SENTRY_TOKEN,
    useValue: new SentryService(options),
  };
}

export function createSentryModuleOptionsProvider(options: SentryModuleOptions): Provider {
  return {
    provide: SENTRY_MODULE_OPTIONS,
    useValue: options,
  };
}
