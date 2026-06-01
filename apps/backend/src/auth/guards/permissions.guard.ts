import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { UserPermission } from '../entities/user-permission.entity.js';
import { Permission } from '../../shared/enums/index.js';
import type { RequestWithAuth } from '../types/request-context.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserPermission)
    private readonly permissionRepo: Repository<UserPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    if (!user) throw new ForbiddenException('No authenticated user');

    // TENANT_ADMIN bypasses all permission checks
    if (user.role === 'TENANT_ADMIN') return true;

    const userId = user.userId;
    const tenantId = user.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Missing user context for permission check');
    }

    // Check if user has any of the required permissions
    const userPermissions = await this.permissionRepo.find({
      where: { userId, tenantId },
    });

    const userPermissionSet = new Set(userPermissions.map((p) => p.permission));
    const hasPermission = requiredPermissions.some((p) =>
      userPermissionSet.has(p as Permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermissions.join(' or ')}`,
      );
    }

    return true;
  }
}
