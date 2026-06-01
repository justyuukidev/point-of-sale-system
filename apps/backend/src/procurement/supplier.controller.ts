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
import { SupplierService } from './supplier.service.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';

@ApiTags('Suppliers')
@ApiBearerAuth('firebase-jwt')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.supplierService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List all suppliers' })
  @ApiResponse({ status: 200, description: 'List of suppliers returned' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.supplierService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a supplier by UUID' })
  @ApiParam({ name: 'uuid', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier found' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.supplierService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiParam({ name: 'uuid', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.supplierService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiParam({ name: 'uuid', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.supplierService.remove(uuid, tenantId);
  }
}
