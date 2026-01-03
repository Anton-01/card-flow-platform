import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const user = request.user as CurrentUserPayload | undefined;
    const userId = user?.id || 'anonymous';

    const now = Date.now();
    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();

    // Add request ID to response headers
    response.setHeader('X-Request-Id', requestId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log({
            requestId,
            method,
            url: originalUrl,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            userId,
            ip,
            userAgent: userAgent.substring(0, 100),
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - now;
          this.logger.error({
            requestId,
            method,
            url: originalUrl,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            userId,
            ip,
            error: error.message,
          });
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
