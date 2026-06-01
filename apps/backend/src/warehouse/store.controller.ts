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
import { StoreService } from './store.service.js';
import { CreateStoreDto, UpdateStoreDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Stores')
@ApiBearerAuth('firebase-jwt')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  create(
    @Body() dto: CreateStoreDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.storeService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List all stores' })
  @ApiResponse({ status: 200, description: 'List of stores returned' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.storeService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get a store by UUID' })
  @ApiParam({ name: 'uuid', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Store found' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.storeService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Update a store' })
  @ApiParam({ name: 'uuid', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.storeService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a store' })
  @ApiParam({ name: 'uuid', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.storeService.remove(uuid, tenantId);
  }
}
