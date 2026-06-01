import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PurchaseOrderItemService } from './purchase-order-item.service.js';
import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Purchase Order Items')
@ApiBearerAuth('firebase-jwt')
@Controller('purchase-order-items')
export class PurchaseOrderItemController {
  constructor(private readonly poItemService: PurchaseOrderItemService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new purchase order item' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order item created successfully',
  })
  create(
    @Body() dto: CreatePurchaseOrderItemDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poItemService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List purchase order items by purchase order' })
  @ApiQuery({
    name: 'purchaseOrderId',
    description: 'Filter by purchase order ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of purchase order items returned',
  })
  findByPo(
    @Query('purchaseOrderId', ParseIntPipe) purchaseOrderId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poItemService.findByPurchaseOrder(purchaseOrderId, tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a purchase order item by UUID' })
  @ApiParam({ name: 'uuid', description: 'Purchase order item UUID' })
  @ApiResponse({ status: 200, description: 'Purchase order item found' })
  @ApiResponse({ status: 404, description: 'Purchase order item not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poItemService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a purchase order item' })
  @ApiParam({ name: 'uuid', description: 'Purchase order item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order item not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poItemService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a purchase order item' })
  @ApiParam({ name: 'uuid', description: 'Purchase order item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order item not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poItemService.remove(uuid, tenantId);
  }
}
