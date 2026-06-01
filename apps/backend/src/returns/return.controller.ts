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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ReturnService } from './return.service.js';
import { CreateReturnDto, UpdateReturnDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';

@ApiTags('Returns')
@ApiBearerAuth('firebase-jwt')
@Controller('returns')
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Create a return request' })
  @ApiResponse({ status: 201, description: 'Return created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateReturnDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.returnService.create(dto, tenantId, operatorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List return requests' })
  @ApiResponse({ status: 200, description: 'Returns retrieved successfully' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'Filter by store ID',
  })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
    @Query('storeId') storeId?: string,
  ) {
    return this.returnService.findAllByTenant(
      tenantId,
      pagination,
      storeId ? parseInt(storeId, 10) : undefined,
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a return request by UUID' })
  @ApiResponse({ status: 200, description: 'Return retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.findOneByUuid(uuid, tenantId);
  }

  @Get(':uuid/line-items')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get line items for a return' })
  @ApiResponse({
    status: 200,
    description: 'Return line items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  findLineItems(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.findLineItems(uuid, tenantId);
  }

  @Patch(':uuid/approve')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Approve a return request' })
  @ApiResponse({ status: 200, description: 'Return approved successfully' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.approve(uuid, tenantId);
  }

  @Patch(':uuid/reject')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Reject a return request' })
  @ApiResponse({ status: 200, description: 'Return rejected successfully' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateReturnDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.reject(uuid, tenantId, dto.notes);
  }

  @Patch(':uuid/complete')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Complete a return request' })
  @ApiResponse({ status: 200, description: 'Return completed successfully' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  complete(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.complete(uuid, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a return request' })
  @ApiResponse({ status: 200, description: 'Return deleted successfully' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  @ApiParam({ name: 'uuid', description: 'Return UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.returnService.remove(uuid, tenantId);
  }
}
