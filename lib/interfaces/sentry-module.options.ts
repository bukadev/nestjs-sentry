import {
  ConsoleLoggerOptions,
  InjectionToken,
  LoggerService,
  OptionalFactoryDependency,
} from '@nestjs/common';
import { Integration, Options } from '@sentry/types';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface SentryCloseOptions {
  enabled: boolean;
  // timeout – Maximum time in ms the client should wait until closing forcefully
  timeout?: number;
}

export interface LoggingOptions {
  logger?: LoggerService | null;
  loggerOptions?: ConsoleLoggerOptions;
}

export type SentryModuleOptions = Omit<Options, 'integrations'> & {
  integrations?: Integration[];
  close?: SentryCloseOptions;
  prefix?: string;
} & LoggingOptions;

export interface SentryOptionsFactory {
  createSentryModuleOptions(): Promise<SentryModuleOptions> | SentryModuleOptions;
}

export interface SentryModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: Array<InjectionToken | OptionalFactoryDependency> | never;
  useClass?: Type<SentryOptionsFactory>;
  useExisting?: Type<SentryOptionsFactory>;
  useFactory?: (...args: unknown[]) => Promise<SentryModuleOptions> | SentryModuleOptions;
}
