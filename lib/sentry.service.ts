import { ConsoleLogger, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { OnApplicationShutdown } from '@nestjs/common';
import { Client } from '@sentry/types';
import * as Sentry from '@sentry/node';
import { SENTRY_MODULE_OPTIONS } from './sentry.tokens';
import { SentryModuleOptions } from './interfaces';

@Injectable()
export class SentryService implements OnApplicationShutdown, LoggerService {
  private static serviceInstance: SentryService;
  constructor(
    @Inject(SENTRY_MODULE_OPTIONS)
    readonly options?: SentryModuleOptions,
  ) {
    if (!(options && options.dsn)) return;

    const { integrations = [], logger, loggerOptions, ...sentryOptions } = options;
    if (typeof logger === 'undefined') {
      options.logger = new ConsoleLogger('SentryModule', loggerOptions || {});
    }
    Sentry.init({
      ...sentryOptions,
      integrations: [
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: async (err) => {
            if (this.options && this.options.logger && this.options.logger.fatal) {
              this.options.logger.fatal(err);
            }
            if (err.name === 'SentryError') {
              console.log(err);
            } else {
              Sentry.getCurrentHub().getClient<Client>().captureException(err);
              process.exit(1);
            }
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
        ...integrations,
      ],
    });
  }

  public static SentryServiceInstance(): SentryService {
    if (!SentryService.serviceInstance) {
      SentryService.serviceInstance = new SentryService();
    }
    return SentryService.serviceInstance;
  }

  log(message: string, context?: string, asBreadcrumb?: boolean) {
    if (this.options.prefix) {
      message = `${this.options.prefix}: ${message}`;
    }
    if (this.options && this.options.logger) {
      this.options.logger.log(message, context);
    }
    try {
      asBreadcrumb
        ? Sentry.addBreadcrumb({
            message,
            level: 'log',
            data: {
              context,
            },
          })
        : Sentry.captureMessage(message, 'log');
    } catch (err) {
      Logger.error(err, SentryService.name);
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (this.options.prefix) {
      message = `${this.options.prefix}: ${message}`;
    }
    try {
      if (this.options && this.options.logger && this.options.logger.error) {
        this.options.logger.error(message, trace, context);
      }
      Sentry.captureMessage(message, 'error');
    } catch (err) {
      Logger.error(err, SentryService.name);
    }
  }

  warn(message: string, context?: string, asBreadcrumb?: boolean) {
    if (this.options.prefix) {
      message = `${this.options.prefix}: ${message}`;
    }
    try {
      if (this.options && this.options.logger && this.options.logger.warn) {
        this.options.logger.warn(message, context);
      }
      asBreadcrumb
        ? Sentry.addBreadcrumb({
            message,
            level: 'warning',
            data: {
              context,
            },
          })
        : Sentry.captureMessage(message, 'warning');
    } catch (err) {
      Logger.error(err, SentryService.name);
    }
  }

  debug(message: string, context?: string, asBreadcrumb?: boolean) {
    if (this.options.prefix) {
      message = `${this.options.prefix}: ${message}`;
    }
    try {
      if (this.options && this.options.logger && this.options.logger.debug) {
        this.options.logger.debug(message, context);
      }
      asBreadcrumb
        ? Sentry.addBreadcrumb({
            message,
            level: 'debug',
            data: {
              context,
            },
          })
        : Sentry.captureMessage(message, 'debug');
    } catch (err) {
      Logger.error(err, SentryService.name);
    }
  }

  verbose(message: string, context?: string, asBreadcrumb?: boolean) {
    if (this.options.prefix) {
      message = `${this.options.prefix}: ${message}`;
    }
    try {
      if (this.options && this.options.logger && this.options.logger.verbose) {
        this.options.logger.verbose(message, context);
      }
      asBreadcrumb
        ? Sentry.addBreadcrumb({
            message,
            level: 'info',
            data: {
              context,
            },
          })
        : Sentry.captureMessage(message, 'info');
    } catch (err) {
      Logger.error(err, SentryService.name);
    }
  }

  instance() {
    return Sentry;
  }

  async onApplicationShutdown(signal?: string) {
    if (this.options?.close?.enabled === true) {
      if (this.options && this.options.logger && this.options.logger.verbose && this.options.prefix) {
        this.options.logger.log(`${this.options.prefix}: ${signal}`);
      }
      await Sentry.close(this.options?.close.timeout);
    }
  }
}
