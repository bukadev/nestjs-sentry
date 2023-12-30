import { Test, TestingModule } from '@nestjs/testing';
import { SentryModuleOptions } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { InjectSentry } from '../decorators';
import { SentryModule } from '../sentry.module';
import { SentryService } from '../sentry.service';

describe('InjectSentry', () => {
  const config: SentryModuleOptions = {
    dsn: 'https://45740e3ae4864e77a01ad61a47ea3b7e@o115888.ingest.sentry.io/25956308132020',
    debug: true,
    environment: 'development',
    loggerOptions: {
      logLevels: ['debug'],
    },
  };
  let module: TestingModule;

  @Injectable()
  class TestService {
    public constructor(@InjectSentry() public readonly client: SentryService) {}
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SentryModule.forRoot(config)],
      providers: [TestService],
    }).compile();
  });

  afterEach(async () => {
    await module?.close();
  });

  describe('when using @InjectSentry() in a service constructor', () => {
    it('should inject the sentry client', () => {
      const testService = module.get(TestService);
      expect(testService).toHaveProperty('client');
      expect(testService.client).toBeInstanceOf(SentryService);
    });
  });
});
