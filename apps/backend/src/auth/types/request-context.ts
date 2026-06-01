import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserRole } from '../../shared/enums/index.js';

export interface AuthenticatedUserClaims extends DecodedIdToken {
  tenantId?: number;
  userId?: number;
  dbUserId?: number;
  operatorId?: number;
  role?: UserRole | string;
}

export interface OperatorContext {
  id: number;
  uuid: string;
  username: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  storeId: number | null;
  warehouseId: number | null;
  tenantId: number;
}

export interface RequestWithAuth {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUserClaims;
  operator?: OperatorContext;
}
