import { Module, Global, Provider, DynamicModule } from '@nestjs/common';
import { SENTRY_MODULE_OPTIONS, SENTRY_TOKEN } from './sentry.tokens';
import { SentryService } from './sentry.service';
import { createSentryModuleOptionsProvider, createSentryProvider } from './sentry.providers';
import { SentryModuleAsyncOptions, SentryModuleOptions, SentryOptionsFactory } from './interfaces';

@Module({})
export class SentryModule {
  public static forRoot(options: SentryModuleOptions): DynamicModule {
    const sentryProvider = createSentryProvider(options);
    const sentryModuleOptionsProvider = createSentryModuleOptionsProvider(options);
    return {
      global: true,
      module: SentryModule,
      providers: [sentryModuleOptionsProvider, sentryProvider, SentryService],
      exports: [sentryProvider, SentryService],
    };
  }

  public static forRootAsync(options: SentryModuleAsyncOptions): DynamicModule {
    const provider: Provider = {
      inject: [SENTRY_MODULE_OPTIONS],
      provide: SENTRY_TOKEN,
      useFactory: (options: SentryModuleOptions) => new SentryService(options),
    };

    return {
      global: true,
      module: SentryModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), provider, SentryService],
      exports: [provider, SentryService],
    };
  }

  private static createAsyncProviders(options: SentryModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: SentryModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        inject: options.inject || [],
        provide: SENTRY_MODULE_OPTIONS,
        useFactory: options.useFactory,
      };
    }
    return {
      provide: SENTRY_MODULE_OPTIONS,
      useFactory: async (optionsFactory: SentryOptionsFactory) =>
        await optionsFactory.createSentryModuleOptions(),
      inject: [options.useClass || options.useExisting],
    };
  }
}
