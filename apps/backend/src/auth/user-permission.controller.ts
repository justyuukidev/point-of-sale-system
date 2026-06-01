import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserPermissionService } from './user-permission.service.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Permission } from '../shared/enums/index.js';
import { IsEnum, IsArray } from 'class-validator';

class GrantPermissionDto {
  @IsEnum(Permission)
  permission!: Permission;
}

class SetPermissionsDto {
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}

@ApiTags('User Permissions')
@ApiBearerAuth('firebase-jwt')
@Controller('users/:userId/permissions')
export class UserPermissionController {
  constructor(private readonly permissionService: UserPermissionService) {}

  @Get()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'List permissions for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all permissions for the user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  findAll(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.permissionService.findByUser(userId, tenantId);
  }

  @Put()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Set all permissions for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions replaced successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  setAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: SetPermissionsDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.permissionService.setPermissions(
      userId,
      dto.permissions,
      tenantId,
    );
  }

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Grant a single permission to a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Permission granted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  grant(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: GrantPermissionDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.permissionService.grant(userId, dto.permission, tenantId);
  }

  @Delete(':permission')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Revoke a single permission from a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'permission', description: 'Permission to revoke' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  revoke(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permission') permission: Permission,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.permissionService.revoke(userId, permission, tenantId);
  }
}
