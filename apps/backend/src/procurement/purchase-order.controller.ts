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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PurchaseOrderService } from './purchase-order.service.js';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';

@ApiTags('Purchase Orders')
@ApiBearerAuth('firebase-jwt')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
  })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.poService.create(dto, tenantId, operatorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List all purchase orders' })
  @ApiResponse({ status: 200, description: 'List of purchase orders returned' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.poService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a purchase order by UUID' })
  @ApiParam({ name: 'uuid', description: 'Purchase order UUID' })
  @ApiResponse({ status: 200, description: 'Purchase order found' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiParam({ name: 'uuid', description: 'Purchase order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiParam({ name: 'uuid', description: 'Purchase order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.poService.remove(uuid, tenantId);
  }
}
