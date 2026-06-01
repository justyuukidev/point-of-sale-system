import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestWithAuth } from '../types/request-context.js';

/**
 * RolesGuard checks authorization via:
 * 1. Firebase token custom claims (role field) — for tenant admin direct login
 * 2. request.operator context — set by operator-switch middleware/interceptor for subordinate users
 *
 * If neither provides a role, access is denied.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    // Check operator context first (set by operator session switch)
    const operatorRole = request.operator?.role;
    // Fall back to Firebase token claims
    const tokenRole = user?.role;

    const effectiveRole = operatorRole || tokenRole;

    if (!effectiveRole || !requiredRoles.includes(effectiveRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
