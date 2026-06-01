import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { OperatorSession } from '../entities/operator-session.entity.js';
import { User } from '../entities/user.entity.js';
import type { RequestWithAuth } from '../types/request-context.js';

/**
 * Attaches `request.operator` with the active operator's info
 * based on the X-Device-UUID header and the authenticated tenant.
 *
 * This allows RolesGuard and PermissionsGuard to use the operator's
 * role/permissions instead of the Firebase token's claims.
 */
@Injectable()
export class OperatorContextInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(OperatorSession)
    private readonly sessionRepo: Repository<OperatorSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const deviceUuidRaw = request.headers['x-device-uuid'];
    const deviceUuid = Array.isArray(deviceUuidRaw)
      ? deviceUuidRaw[0]
      : deviceUuidRaw;
    const user = request.user;
    const tenantId = user?.tenantId;

    if (deviceUuid && tenantId && user) {
      // Look up active session by device UUID
      // We need to join through device, but for performance we use a raw approach
      const session = await this.sessionRepo
        .createQueryBuilder('s')
        .innerJoin(
          'devices',
          'd',
          'd.id = s."deviceId" AND d.uuid = :deviceUuid',
          { deviceUuid },
        )
        .where('s."tenantId" = :tenantId', { tenantId })
        .andWhere('s."isActive" = true')
        .getOne();

      if (session) {
        const operator = await this.userRepo.findOne({
          where: { id: session.operatorId },
          select: [
            'id',
            'uuid',
            'username',
            'firstName',
            'lastName',
            'role',
            'storeId',
            'warehouseId',
            'tenantId',
          ],
        });

        if (operator) {
          request.operator = operator;
          // Also set tenantId from operator for tenant-scoped operations
          user.tenantId = operator.tenantId;
          user.operatorId = operator.id;
          user.role = operator.role;
        }
      }
    }

    return next.handle();
  }
}
