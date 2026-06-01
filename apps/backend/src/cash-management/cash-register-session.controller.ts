import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CashRegisterSessionService } from './cash-register-session.service.js';
import {
  CreateCashRegisterSessionDto,
  CloseCashRegisterSessionDto,
} from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUserClaims } from '../auth/types/request-context.js';

@ApiTags('Cash Register Sessions')
@ApiBearerAuth('firebase-jwt')
@Controller('cash-register-sessions')
export class CashRegisterSessionController {
  constructor(private readonly sessionService: CashRegisterSessionService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Open a new cash register session' })
  @ApiResponse({ status: 201, description: 'Session opened successfully' })
  @ApiResponse({
    status: 400,
    description: 'Already an open session on this device',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateCashRegisterSessionDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser() user: AuthenticatedUserClaims,
  ) {
    const actorId = user?.operatorId ?? user?.dbUserId ?? user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('Missing authenticated operator context');
    }

    return this.sessionService.create(dto, tenantId, actorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List cash register sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'Filter by store ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (OPEN/CLOSED)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results (default 50, max 200)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Pagination offset',
  })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (storeId) {
      return this.sessionService.findOpenByStore(Number(storeId), tenantId);
    }
    return this.sessionService.findAllByTenant(tenantId, {
      status: status as any,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a cash register session by UUID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'uuid', description: 'Session UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.sessionService.findOneByUuid(uuid, tenantId);
  }

  @Post(':uuid/close')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Close a cash register session' })
  @ApiResponse({ status: 200, description: 'Session closed successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'uuid', description: 'Session UUID' })
  close(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CloseCashRegisterSessionDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser() user: AuthenticatedUserClaims,
  ) {
    const actorId = user?.operatorId ?? user?.dbUserId ?? user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('Missing authenticated operator context');
    }

    return this.sessionService.close(uuid, dto, tenantId, actorId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a cash register session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'uuid', description: 'Session UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.sessionService.remove(uuid, tenantId);
  }
}
