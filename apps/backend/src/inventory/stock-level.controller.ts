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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StockLevelService } from './stock-level.service.js';
import { CreateStockLevelDto, UpdateStockLevelDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Stock Levels')
@ApiBearerAuth('firebase-jwt')
@Controller('stock-levels')
export class StockLevelController {
  constructor(private readonly stockLevelService: StockLevelService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new stock level record' })
  @ApiResponse({ status: 201, description: 'Stock level created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() dto: CreateStockLevelDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.stockLevelService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER')
  @ApiOperation({ summary: 'List stock levels with optional filters' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'Filter by store ID',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Filter by product ID',
  })
  @ApiResponse({ status: 200, description: 'List of stock levels' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query('storeId') storeId?: string,
    @Query('productId') productId?: string,
  ) {
    if (storeId) {
      return this.stockLevelService.findByStore(Number(storeId), tenantId);
    }
    if (productId) {
      return this.stockLevelService.findByProduct(Number(productId), tenantId);
    }
    throw new BadRequestException(
      'Either storeId or productId query parameter is required',
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER')
  @ApiOperation({ summary: 'Get a stock level by UUID' })
  @ApiParam({ name: 'uuid', description: 'Stock level UUID' })
  @ApiResponse({ status: 200, description: 'Stock level found' })
  @ApiResponse({ status: 404, description: 'Stock level not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.stockLevelService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a stock level' })
  @ApiParam({ name: 'uuid', description: 'Stock level UUID' })
  @ApiResponse({ status: 200, description: 'Stock level updated successfully' })
  @ApiResponse({ status: 404, description: 'Stock level not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateStockLevelDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.stockLevelService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a stock level' })
  @ApiParam({ name: 'uuid', description: 'Stock level UUID' })
  @ApiResponse({ status: 200, description: 'Stock level deleted successfully' })
  @ApiResponse({ status: 404, description: 'Stock level not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.stockLevelService.remove(uuid, tenantId);
  }
}
