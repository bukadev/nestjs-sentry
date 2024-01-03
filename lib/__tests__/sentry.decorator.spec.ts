import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';

import { InjectSentry } from '../decorators';
import { SentryModule } from '../sentry.module';
import { SentryService } from '../sentry.service';

describe('InjectSentry', () => {
  let MODULE: TestingModule;
  @Injectable()
  class TestService {
    public constructor(@InjectSentry() public readonly client: SentryService) {}
  }

  beforeAll(async () => {
    MODULE = await Test.createTestingModule({
      imports: [
        SentryModule.forRoot({
          dsn: process.env.SENTRY_DNS,
          debug: true,
          environment: 'development',
          loggerOptions: {
            logLevels: ['debug'],
          },
        }),
      ],
      providers: [TestService],
    }).compile();
  });

  afterAll(async () => {
    const service = MODULE.get(SentryService);
    await service.instance().flush();
    await MODULE?.close();
  });

  describe('when using @InjectSentry() in a service constructor', () => {
    it('should inject the sentry client', () => {
      const testService = MODULE.get(TestService);
      expect(testService).toHaveProperty('client');
      expect(testService.client).toBeInstanceOf(SentryService);
    });
  });
});
