import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PhysicalInventoryService } from './physical-inventory.service.js';
import { CreateStockCountDto, RecordCountDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Physical Inventory')
@ApiBearerAuth('firebase-jwt')
@Controller('stock-counts')
export class PhysicalInventoryController {
  constructor(private readonly service: PhysicalInventoryService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Start a new stock count session' })
  @ApiResponse({
    status: 201,
    description: 'Stock count created with all items',
  })
  create(
    @Body() dto: CreateStockCountDto,
    @CurrentUser('operatorId') operatorId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.create(dto, operatorId, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List stock counts for a store' })
  @ApiQuery({ name: 'storeId', required: true, description: 'Store ID' })
  findByStore(
    @Query('storeId', ParseIntPipe) storeId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.findByStore(storeId, tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a stock count with all items' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.findOne(uuid, tenantId);
  }

  @Patch(':uuid/items/:itemId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Record a physical count for an item' })
  recordCount(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: RecordCountDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.recordCount(uuid, itemId, dto, tenantId);
  }

  @Post(':uuid/complete')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Mark stock count as complete (pending approval)' })
  complete(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.complete(uuid, tenantId);
  }

  @Post(':uuid/approve')
  @Roles('TENANT_ADMIN')
  @ApiOperation({
    summary: 'Approve stock count and apply adjustments to inventory',
  })
  approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('operatorId') operatorId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.approve(uuid, operatorId, tenantId);
  }

  @Post(':uuid/cancel')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Cancel a stock count' })
  cancel(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.cancel(uuid, tenantId);
  }
}
