import { SeverityLevel, AddRequestDataToEventOptions } from '@sentry/node';

export interface SentryFilterFunction {
  (exception: unknown | Error): boolean;
}

export type InstantiableType = new (...args: unknown[]) => unknown;

export interface SentryInterceptorOptionsFilter {
  type: InstantiableType | string[];
  filter?: SentryFilterFunction;
}

export interface SentryInterceptorOptions extends AddRequestDataToEventOptions {
  filters?: SentryInterceptorOptionsFilter[];
  tags?: { [key: string]: string };
  extra?: { [key: string]: unknown };
  fingerprint?: string[];
  level?: SeverityLevel;
}
