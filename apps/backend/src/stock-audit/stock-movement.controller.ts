import {
  Controller,
  Post,
  Get,
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
import { StockMovementService } from './stock-movement.service.js';
import { CreateStockMovementDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole, StockMovementType } from '../shared/enums/index.js';

@ApiTags('Stock Movements')
@ApiBearerAuth('firebase-jwt')
@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly service: StockMovementService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Record a stock movement' })
  @ApiResponse({
    status: 201,
    description: 'Stock movement recorded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser('operatorId') operatorId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.service.create(dto, operatorId, tenantId);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'List stock movements' })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
  })
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
  @ApiQuery({
    name: 'movementType',
    required: false,
    description: 'Filter by movement type',
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
    @Query('productId') productId?: string,
    @Query('movementType') movementType?: StockMovementType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      tenantId,
      storeId ? Number(storeId) : undefined,
      productId ? Number(productId) : undefined,
      movementType,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':uuid')
  @Roles(UserRole.TENANT_ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get a stock movement by UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stock movement retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Stock movement not found' })
  @ApiParam({ name: 'uuid', description: 'Stock movement UUID' })
  async findOne(
    @Param('uuid') uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    const movement = await this.service.findOneByUuid(uuid, tenantId);
    if (!movement) throw new NotFoundException('Stock movement not found');
    return movement;
  }
}
