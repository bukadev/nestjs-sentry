// Nestjs imports
import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { HttpArgumentsHost, WsArgumentsHost, RpcArgumentsHost, ContextType } from '@nestjs/common/interfaces';
// Rxjs imports
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// Sentry imports
import { Scope } from '@sentry/core';
import { addRequestDataToEvent } from '@sentry/node';

import { SentryService } from './sentry.service';
import { InstantiableType, SentryInterceptorOptions, SentryInterceptorOptionsFilter } from './interfaces';
import { isStringArray } from './utils';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  protected readonly client: SentryService = SentryService.SentryServiceInstance();

  constructor(private readonly options?: SentryInterceptorOptions) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap({
        error: (exception: HttpException) => {
          if (this.shouldReport(exception)) {
            this.client.instance().withScope((scope) => this.captureException(context, scope, exception));
          }
        },
      }),
    );
  }

  protected captureException(context: ExecutionContext, scope: Scope, exception: HttpException) {
    switch (context.getType<ContextType>()) {
      case 'http':
        return this.captureHttpException(scope, context.switchToHttp(), exception);
      case 'rpc':
        return this.captureRpcException(scope, context.switchToRpc(), exception);
      case 'ws':
        return this.captureWsException(scope, context.switchToWs(), exception);
    }
  }

  private captureHttpException(scope: Scope, http: HttpArgumentsHost, exception: HttpException): void {
    const data = addRequestDataToEvent({}, http.getRequest(), { include: { ...this.options?.include } });

    scope.setExtra('req', data.request);

    if (data.extra) scope.setExtras(data.extra);
    if (data.user) scope.setUser(data.user);

    this.client.instance().captureException(exception);
  }

  private captureRpcException(scope: Scope, rpc: RpcArgumentsHost, exception: unknown): void {
    scope.setExtra('rpc_data', rpc.getData());

    this.client.instance().captureException(exception);
  }

  private captureWsException(scope: Scope, ws: WsArgumentsHost, exception: unknown): void {
    scope.setExtra('ws_client', ws.getClient());
    scope.setExtra('ws_data', ws.getData());

    this.client.instance().captureException(exception);
  }

  private shouldReport(exception: unknown) {
    if (this.options && !this.options.filters) return true;

    // If any filter passes, then we do not report
    if (this.options) {
      const opts: SentryInterceptorOptions = this.options as {};
      if (opts.filters) {
        const filters: SentryInterceptorOptionsFilter[] = opts.filters;
        return filters.some(({ type, filter }) => {
          if (isStringArray(type) && exception instanceof Error) {
            return !type.some((type) => exception.name.includes(type)) && (!filter || filter(exception));
          }

          return !(exception instanceof <InstantiableType>type && (!filter || filter(exception)));
        });
      }
    } else {
      return true;
    }
  }
}
