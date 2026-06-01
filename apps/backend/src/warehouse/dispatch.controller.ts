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
import { DispatchService } from './dispatch.service.js';
import { CreateDispatchDto, UpdateDispatchDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Dispatches')
@ApiBearerAuth('firebase-jwt')
@Controller('dispatches')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new dispatch' })
  @ApiResponse({ status: 201, description: 'Dispatch created successfully' })
  create(
    @Body() dto: CreateDispatchDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.dispatchService.create(dto, tenantId, operatorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List all dispatches' })
  @ApiResponse({ status: 200, description: 'List of dispatches returned' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.dispatchService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a dispatch by UUID' })
  @ApiParam({ name: 'uuid', description: 'Dispatch UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch found' })
  @ApiResponse({ status: 404, description: 'Dispatch not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a dispatch' })
  @ApiParam({ name: 'uuid', description: 'Dispatch UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch updated successfully' })
  @ApiResponse({ status: 404, description: 'Dispatch not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateDispatchDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.dispatchService.update(uuid, dto, tenantId, operatorId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a dispatch' })
  @ApiParam({ name: 'uuid', description: 'Dispatch UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Dispatch not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchService.remove(uuid, tenantId);
  }
}
