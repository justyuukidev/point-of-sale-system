import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { UserPermissionService } from './user-permission.service';
import { UserPermissionController } from './user-permission.controller';
import { OperatorSessionService } from './operator-session.service.js';
import { OperatorSessionController } from './operator-session.controller.js';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { OperatorContextInterceptor } from './interceptors/operator-context.interceptor.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import { Device } from './entities/device.entity.js';
import { UserPermission } from './entities/user-permission.entity.js';
import { OperatorSession } from './entities/operator-session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      User,
      Device,
      UserPermission,
      OperatorSession,
    ]),
  ],
  controllers: [
    AuthController,
    TenantController,
    UserController,
    DeviceController,
    UserPermissionController,
    OperatorSessionController,
  ],
  providers: [
    AuthService,
    TenantService,
    UserService,
    DeviceService,
    UserPermissionService,
    OperatorSessionService,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: OperatorContextInterceptor },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [
    TypeOrmModule,
    UserService,
    TenantService,
    DeviceService,
    UserPermissionService,
    OperatorSessionService,
  ],
})
export class AuthModule {}
