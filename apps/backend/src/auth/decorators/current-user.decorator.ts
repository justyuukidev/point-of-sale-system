import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedUserClaims,
  RequestWithAuth,
} from '../types/request-context.js';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;
    if (!data) return user;
    return user?.[data as keyof AuthenticatedUserClaims];
  },
);
