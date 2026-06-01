import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '../../firebase/firebase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { User } from '../entities/user.entity.js';
import type { RequestWithAuth } from '../types/request-context.js';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeaderRaw = request.headers['authorization'];
    const authHeader = Array.isArray(authHeaderRaw)
      ? authHeaderRaw[0]
      : authHeaderRaw;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
      request.user = decodedToken;

      // Enrich with DB user ID if user exists in the database
      const dbUser = await this.userRepo.findOne({
        where: { firebaseUid: decodedToken.uid },
        select: ['id'],
      });
      if (dbUser) {
        request.user.dbUserId = dbUser.id;
        request.user.userId = dbUser.id;
      }

      this.logger.log(
        `Token verified successfully for uid: ${decodedToken.uid}, email: ${decodedToken.email}, registered: ${!!dbUser}`,
      );

      return true;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
