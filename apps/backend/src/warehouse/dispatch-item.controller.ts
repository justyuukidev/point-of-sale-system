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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DispatchItemService } from './dispatch-item.service.js';
import { CreateDispatchItemDto, UpdateDispatchItemDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Dispatch Items')
@ApiBearerAuth('firebase-jwt')
@Controller('dispatch-items')
export class DispatchItemController {
  constructor(private readonly dispatchItemService: DispatchItemService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Create a new dispatch item' })
  @ApiResponse({
    status: 201,
    description: 'Dispatch item created successfully',
  })
  create(
    @Body() dto: CreateDispatchItemDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchItemService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'List dispatch items by dispatch' })
  @ApiQuery({
    name: 'dispatchId',
    description: 'Filter by dispatch ID',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'List of dispatch items returned' })
  findByDispatch(
    @Query('dispatchId', ParseIntPipe) dispatchId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchItemService.findByDispatch(dispatchId, tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Get a dispatch item by UUID' })
  @ApiParam({ name: 'uuid', description: 'Dispatch item UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch item found' })
  @ApiResponse({ status: 404, description: 'Dispatch item not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchItemService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN', 'WAREHOUSE_STAFF')
  @ApiOperation({ summary: 'Update a dispatch item' })
  @ApiParam({ name: 'uuid', description: 'Dispatch item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Dispatch item not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateDispatchItemDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchItemService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a dispatch item' })
  @ApiParam({ name: 'uuid', description: 'Dispatch item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Dispatch item not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.dispatchItemService.remove(uuid, tenantId);
  }
}
