import { Test, TestingModule } from '@nestjs/testing';
import { SentryModuleOptions, SentryOptionsFactory } from '../interfaces';
import { SentryModule } from '../sentry.module';
import { SentryService } from '../sentry.service';
import { SENTRY_TOKEN } from '../sentry.tokens';

import * as Sentry from '@sentry/node';
import { createSentryModuleOptions } from './helpers/create-sentry-module-options';

jest.spyOn(Sentry, 'close').mockImplementation(() => Promise.resolve(true));

describe('SentryService', () => {
  const config: SentryModuleOptions = createSentryModuleOptions();
  const configWithNoLogger: SentryModuleOptions = createSentryModuleOptions({ logger: null });

  const failureConfig = createSentryModuleOptions({
    dsn: 'https://sentry_io_dsn@sentry.io/1512xxx',
  });
  const failureConfigNoLogger: SentryModuleOptions = createSentryModuleOptions({
    dsn: 'https://sentry_io_dsn@sentry.io/1512xxx',
    logger: null,
  });

  class TestServiceNoLogging implements SentryOptionsFactory {
    createSentryModuleOptions(): SentryModuleOptions {
      return configWithNoLogger;
    }
  }

  class FailureService implements SentryOptionsFactory {
    createSentryModuleOptions(): SentryModuleOptions {
      return failureConfig;
    }
  }

  class FailureServiceNoLogging implements SentryOptionsFactory {
    createSentryModuleOptions(): SentryModuleOptions {
      return failureConfigNoLogger;
    }
  }

  describe('sentry.log:error', () => {
    it('should provide the sentry client and call log with disabled logging', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRootAsync({
            useClass: FailureServiceNoLogging,
          }),
        ],
      }).compile();

      const sentryService = mod.get<SentryService>(SENTRY_TOKEN);
      sentryService.log('sentry:log');
      expect(sentryService.log).toBeInstanceOf(Function);
    });

    it('should provide the sentry client and call log', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRootAsync({
            useClass: FailureService,
          }),
        ],
      }).compile();

      const sentryService = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentryService.log).toBeInstanceOf(Function);
    });
  });

  describe('sentry.log', () => {
    it('should provide the sentry client and call log', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      sentry.log('sentry:log');
      expect(sentry.log).toBeInstanceOf(Function);
    });

    it('should provide the sentry client and call log with disabled logging', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRootAsync({
            useClass: TestServiceNoLogging,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      expect(sentry.log).toBeInstanceOf(Function);
    });
  });

  describe('sentry.error', () => {
    it('should provide the sentry client and call error', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      sentry.error('sentry:error');
      expect(sentry.error).toBeInstanceOf(Function);
    });
  });

  describe('sentry.verbose', () => {
    it('should provide the sentry client and call verbose', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      sentry.verbose('sentry:verbose', 'context:verbose');
      expect(sentry.verbose).toBeInstanceOf(Function);
      expect(true).toBeTruthy();
    });
  });

  describe('sentry.debug', () => {
    it('should provide the sentry client and call debug', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      sentry.debug('sentry:debug', 'context:debug');
      expect(sentry.debug).toBeInstanceOf(Function);
    });
  });

  describe('sentry.warn', () => {
    it('should provide the sentry client and call warn', async () => {
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      try {
        sentry.warn('sentry:warn', 'context:warn');
        expect(true).toBeTruthy();
      } catch (err) {}
      expect(sentry.warn).toBeInstanceOf(Function);
    });
  });

  describe('sentry.close', () => {
    it('should not close the sentry if not specified in config', async () => {
      const mod = await Test.createTestingModule({
        imports: [SentryModule.forRoot(config)],
      }).compile();
      mod.enableShutdownHooks();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      await mod.close();
    });

    it('should close the sentry if specified in config', async () => {
      const timeout = 100;
      const mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
            close: {
              enabled: true,
              timeout,
            },
          }),
        ],
      }).compile();
      mod.enableShutdownHooks();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
      await mod.close();
    });
  });

  describe('Sentry Service asBreadcrumb implementation', () => {
    let mod: TestingModule;
    let sentry: SentryService;

    beforeAll(async () => {
      mod = await Test.createTestingModule({
        imports: [
          SentryModule.forRoot({
            ...config,
          }),
        ],
      }).compile();

      sentry = mod.get<SentryService>(SENTRY_TOKEN);
    });

    afterAll(async () => {
      await mod.close();
    });

    it('sentry.SentryServiceInstance', () => {
      expect(SentryService.SentryServiceInstance).toBeInstanceOf(Function);
    });

    it('sentry.instance', () => {
      expect(sentry.instance).toBeInstanceOf(Function);
    });

    it('sentry.log asBreabcrumb === true', () => {
      sentry.log('sentry:log', 'context:log', true);
      expect(sentry.log).toBeInstanceOf(Function);
    });

    it('sentry.debug asBreabcrumb === true', () => {
      sentry.debug('sentry:debug', 'context:debug', true);
      expect(sentry.debug).toBeInstanceOf(Function);
    });

    it('sentry.verbose asBreabcrumb === true', () => {
      sentry.verbose('sentry:verbose', 'context:verbose', true);
      expect(sentry.verbose).toBeInstanceOf(Function);
    });

    it('sentry.warn asBreabcrumb === true', () => {
      sentry.verbose('sentry:warn', 'context:warn', true);
      expect(sentry.warn).toBeInstanceOf(Function);
    });
  });
});
