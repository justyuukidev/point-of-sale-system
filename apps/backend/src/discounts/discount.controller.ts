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
import { DiscountService } from './discount.service.js';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Discounts')
@ApiBearerAuth('firebase-jwt')
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @Permissions('MANAGE_DISCOUNTS')
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() dto: CreateDiscountDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.discountService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List all discounts for the tenant' })
  @ApiResponse({ status: 200, description: 'List of discounts' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.discountService.findAllByTenant(tenantId, pagination);
  }

  @Get('active')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List currently active discounts' })
  @ApiResponse({ status: 200, description: 'List of active discounts' })
  findActive(@CurrentUser('tenantId') tenantId: number) {
    return this.discountService.findActive(tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a discount by UUID' })
  @ApiParam({ name: 'uuid', description: 'Discount UUID' })
  @ApiResponse({ status: 200, description: 'Discount found' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.discountService.findOneByUuid(uuid, tenantId);
  }

  @Get(':uuid/history')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get promotion history for a discount' })
  @ApiParam({ name: 'uuid', description: 'Discount UUID' })
  @ApiResponse({ status: 200, description: 'Discount promotion history' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  findHistory(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.discountService.findHistory(uuid, tenantId, pagination);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @Permissions('MANAGE_DISCOUNTS')
  @ApiOperation({ summary: 'Update a discount' })
  @ApiParam({ name: 'uuid', description: 'Discount UUID' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateDiscountDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.discountService.update(uuid, dto, tenantId, userId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiParam({ name: 'uuid', description: 'Discount UUID' })
  @ApiResponse({ status: 200, description: 'Discount deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.discountService.remove(uuid, tenantId);
  }
}
