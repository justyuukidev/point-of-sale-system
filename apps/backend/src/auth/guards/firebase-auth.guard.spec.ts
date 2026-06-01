import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from '../../firebase/firebase.service';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let firebaseService: Partial<FirebaseService>;
  let reflector: Reflector;

  const mockExecutionContext = (
    headers: Record<string, string> = {},
    isPublic = false,
  ): ExecutionContext => {
    const request = { headers, user: undefined };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      _request: request,
    } as any;
  };

  let verifyIdToken: jest.Mock;
  let mockUserRepo: any;

  beforeEach(() => {
    verifyIdToken = jest.fn();
    firebaseService = {
      auth: { verifyIdToken } as any,
    };
    reflector = new Reflector();
    mockUserRepo = { findOne: jest.fn().mockResolvedValue(null) };
    guard = new FirebaseAuthGuard(
      firebaseService as FirebaseService,
      reflector,
      mockUserRepo,
    );
  });

  it('should allow access to public routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = mockExecutionContext();
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = mockExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when header is not Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = mockExecutionContext({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    verifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const context = mockExecutionContext({
      authorization: 'Bearer invalid-token',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach decoded token to request and allow access', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const decodedToken = {
      uid: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
    };
    verifyIdToken.mockResolvedValue(decodedToken);

    const context = mockExecutionContext({
      authorization: 'Bearer valid-token',
    });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect((context as any)._request.user).toEqual(decodedToken);
  });
});
