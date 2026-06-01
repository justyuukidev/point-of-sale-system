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
import { ReceivingRecordService } from './receiving-record.service.js';
import {
  CreateReceivingRecordDto,
  UpdateReceivingRecordDto,
} from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Receiving Records')
@ApiBearerAuth('firebase-jwt')
@Controller('receiving-records')
export class ReceivingRecordController {
  constructor(private readonly rrService: ReceivingRecordService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new receiving record' })
  @ApiResponse({
    status: 201,
    description: 'Receiving record created successfully',
  })
  create(
    @Body() dto: CreateReceivingRecordDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.rrService.create(dto, tenantId, operatorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List all receiving records' })
  @ApiResponse({
    status: 200,
    description: 'List of receiving records returned',
  })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.rrService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a receiving record by UUID' })
  @ApiParam({ name: 'uuid', description: 'Receiving record UUID' })
  @ApiResponse({ status: 200, description: 'Receiving record found' })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.rrService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a receiving record' })
  @ApiParam({ name: 'uuid', description: 'Receiving record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving record updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateReceivingRecordDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.rrService.update(uuid, dto, tenantId, operatorId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a receiving record' })
  @ApiParam({ name: 'uuid', description: 'Receiving record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.rrService.remove(uuid, tenantId);
  }
}
