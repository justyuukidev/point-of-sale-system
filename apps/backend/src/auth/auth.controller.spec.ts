import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('health', () => {
    it('should return status ok', () => {
      expect(controller.health()).toEqual({ status: 'ok' });
    });
  });

  describe('getProfile', () => {
    it('should return uid, email, and role from the decoded token', () => {
      const mockUser = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      expect(controller.getProfile(mockUser)).toEqual({
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'ADMIN',
      });
    });

    it('should return null role when no role claim exists', () => {
      const mockUser = {
        uid: 'firebase-uid-456',
        email: 'cashier@example.com',
      };

      expect(controller.getProfile(mockUser)).toEqual({
        uid: 'firebase-uid-456',
        email: 'cashier@example.com',
        role: null,
      });
    });
  });
});
