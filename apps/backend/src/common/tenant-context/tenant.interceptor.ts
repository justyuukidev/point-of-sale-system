import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service.js';
import type { RequestWithAuth } from '../../auth/types/request-context.js';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    if (!user?.tenantId) {
      // Public routes or pre-registration routes — skip tenant context
      return next.handle();
    }

    // Prefer operatorId (set by OperatorContextInterceptor) for accurate audit trail
    const operator = request.operator;
    const effectiveUserId = operator?.id ?? user.userId ?? user.dbUserId ?? 0;
    const tenantId = user.tenantId;

    return new Observable((subscriber) => {
      this.tenantContext.run({ tenantId, userId: effectiveUserId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
