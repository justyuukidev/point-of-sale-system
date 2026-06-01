import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OperationLogService } from './operation-log.service.js';
import { OperationAction } from './entities/operation-log.entity.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Operation Logs')
@ApiBearerAuth('firebase-jwt')
@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List operation logs with filters' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'Filter by entity type (e.g., Product, Category)',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    description: 'Filter by entity ID',
  })
  @ApiQuery({ name: 'action', required: false, enum: OperationAction })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'ISO date string',
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: OperationAction,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.operationLogService.findAll({
      tenantId,
      entityType,
      entityId: entityId ? parseInt(entityId, 10) : undefined,
      action,
      userId: userId ? parseInt(userId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(':entityType/:entityId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get operation history for a specific entity' })
  async findByEntity(
    @CurrentUser('tenantId') tenantId: number,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.operationLogService.findByEntity(
      tenantId,
      entityType,
      entityId,
    );
  }
}
