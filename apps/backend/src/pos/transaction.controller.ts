import {
  Controller,
  Get,
  Post,
  Patch,
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
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUserClaims } from '../auth/types/request-context.js';

@ApiTags('Transactions')
@ApiBearerAuth('firebase-jwt')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser() user: AuthenticatedUserClaims,
  ) {
    const actorId = user?.operatorId ?? user?.dbUserId ?? user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('Missing authenticated operator context');
    }

    return this.transactionService.create(dto, tenantId, actorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'Filter by store ID',
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
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionService.findAllByTenant(
      tenantId,
      storeId ? Number(storeId) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a transaction by UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiParam({ name: 'uuid', description: 'Transaction UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.transactionService.findOneWithDetails(uuid, tenantId);
  }

  @Patch(':uuid/void')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Void a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction voided successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiParam({ name: 'uuid', description: 'Transaction UUID' })
  void(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.transactionService.void(uuid, tenantId);
  }

  @Get(':uuid/line-items')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get line items for a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Line items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiParam({ name: 'uuid', description: 'Transaction UUID' })
  getLineItems(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.transactionService.getLineItems(uuid, tenantId);
  }

  @Get(':uuid/payments')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get payments for a transaction' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiParam({ name: 'uuid', description: 'Transaction UUID' })
  getPayments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.transactionService.getPayments(uuid, tenantId);
  }
}
