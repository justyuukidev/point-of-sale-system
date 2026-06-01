import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/index.js';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedUserClaims } from './types/request-context.js';

@ApiTags('Users')
@ApiBearerAuth('firebase-jwt')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  create(
    @CurrentUser('tenantId') tenantId: number,
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.create(tenantId, dto);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List all users for the tenant' })
  @ApiResponse({ status: 200, description: 'Returns all users in the tenant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN or STORE_MANAGER role',
  })
  findAll(@CurrentUser('tenantId') tenantId: number) {
    return this.userService.findAllByTenant(tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user details' })
  @ApiResponse({ status: 200, description: 'Returns the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: AuthenticatedUserClaims) {
    const dbUser = await this.userService.findByFirebaseUid(user.uid);
    if (!dbUser) {
      return { uid: user.uid, email: user.email, registered: false };
    }
    return dbUser;
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN or STORE_MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(
    @CurrentUser('tenantId') tenantId: number,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return this.userService.findOneByUuidForTenant(tenantId, uuid);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @CurrentUser('tenantId') tenantId: number,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(tenantId, uuid, dto);
  }

  @Patch(':uuid/deactivate')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(
    @CurrentUser('tenantId') tenantId: number,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return this.userService.deactivateForTenant(tenantId, uuid);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @CurrentUser('tenantId') tenantId: number,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return this.userService.removeForTenant(tenantId, uuid);
  }
}
