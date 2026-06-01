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
  ApiQuery,
} from '@nestjs/swagger';
import { BatchService } from './batch.service.js';
import { CreateBatchDto, UpdateBatchDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Batches')
@ApiBearerAuth('firebase-jwt')
@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  create(
    @Body() dto: CreateBatchDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.batchService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List all batches' })
  @ApiQuery({
    name: 'warehouseId',
    description: 'Filter by warehouse ID',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'List of batches returned' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.batchService.findAllByTenant(
      tenantId,
      pagination,
      warehouseId ? +warehouseId : undefined,
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a batch by UUID' })
  @ApiParam({ name: 'uuid', description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch found' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.batchService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a batch' })
  @ApiParam({ name: 'uuid', description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.batchService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a batch' })
  @ApiParam({ name: 'uuid', description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.batchService.remove(uuid, tenantId);
  }
}
