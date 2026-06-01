import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service.js';
import { CreateNotificationDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../shared/enums/index.js';

@ApiTags('Notifications')
@ApiBearerAuth('firebase-jwt')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'List notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'Filter by store ID',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    description: 'Filter by read status (true/false)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 50)',
  })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query('userId') userId?: string,
    @Query('storeId') storeId?: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      tenantId,
      userId ? Number(userId) : undefined,
      storeId ? Number(storeId) : undefined,
      isRead !== undefined ? isRead === 'true' : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':uuid')
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get a notification by UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'uuid', description: 'Notification UUID' })
  async findOne(
    @Param('uuid') uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    const notification = await this.service.findOneByUuid(uuid, tenantId);
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  @Patch(':uuid/read')
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'uuid', description: 'Notification UUID' })
  async markAsRead(
    @Param('uuid') uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    const notification = await this.service.markAsRead(uuid, tenantId);
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  @Patch('read-all')
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.service.markAllAsRead(tenantId, userId);
  }

  @Delete(':uuid')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'uuid', description: 'Notification UUID' })
  async remove(
    @Param('uuid') uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    const deleted = await this.service.remove(uuid, tenantId);
    if (!deleted) throw new NotFoundException('Notification not found');
    return { deleted: true };
  }
}
