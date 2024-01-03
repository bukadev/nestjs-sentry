import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { SentryModule } from '../sentry.module';
import { SentryModuleOptions, SentryOptionsFactory } from '../interfaces';
import { SentryService } from '../sentry.service';
import { SENTRY_TOKEN } from '../sentry.tokens';

describe('SentryModule', () => {
  const CONFIG: SentryModuleOptions = {
    dsn: process.env.SENTRY_DNS,
    debug: true,
    environment: 'development',
    loggerOptions: {
      logLevels: ['debug'],
    },
  };

  class TestService implements SentryOptionsFactory {
    createSentryModuleOptions(): SentryModuleOptions {
      return CONFIG;
    }
  }

  @Module({
    exports: [TestService],
    providers: [TestService],
  })
  class TestModule {}

  describe('Static Initialization: forRoot', () => {
    it('should provide the sentry client', async () => {
      const mod = await Test.createTestingModule({
        imports: [SentryModule.forRoot(CONFIG)],
      }).compile();

      const sentry = mod.get<SentryService>(SENTRY_TOKEN);
      console.log('sentry', sentry);
      expect(sentry).toBeDefined();
      expect(sentry).toBeInstanceOf(SentryService);
    });
  });

  describe('Dynamic Initialization: forRootAsync', () => {
    describe('when the `useFactory` option is used', () => {
      it('should provide sentry client', async () => {
        const mod = await Test.createTestingModule({
          imports: [
            SentryModule.forRootAsync({
              useFactory: () => CONFIG,
            }),
          ],
        }).compile();

        const sentry = mod.get<SentryService>(SENTRY_TOKEN);
        expect(sentry).toBeDefined();
        expect(sentry).toBeInstanceOf(SentryService);
      });
    });

    describe('when the `useClass` option is used', () => {
      it('should provide the sentry client', async () => {
        const mod = await Test.createTestingModule({
          imports: [
            SentryModule.forRootAsync({
              useClass: TestService,
            }),
          ],
        }).compile();

        const sentry = mod.get<SentryService>(SENTRY_TOKEN);
        expect(sentry).toBeDefined();
        expect(sentry).toBeInstanceOf(SentryService);
      });
    });

    describe('when the `useExisting` option is used', () => {
      it('should provide the stripe client', async () => {
        const mod = await Test.createTestingModule({
          imports: [
            SentryModule.forRootAsync({
              imports: [TestModule],
              useExisting: TestService,
            }),
          ],
        }).compile();

        const sentry = mod.get<SentryService>(SENTRY_TOKEN);
        expect(sentry).toBeDefined();
        expect(sentry).toBeInstanceOf(SentryService);
      });
    });
  });
});
