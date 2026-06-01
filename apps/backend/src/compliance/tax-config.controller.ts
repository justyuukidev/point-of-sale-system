import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TaxConfigService } from './tax-config.service.js';
import { CreateTaxConfigDto, UpdateTaxConfigDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Tax Config')
@ApiBearerAuth('firebase-jwt')
@Controller('tax-configs')
export class TaxConfigController {
  constructor(private readonly taxConfigService: TaxConfigService) {}

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Create a tax configuration' })
  @ApiResponse({
    status: 201,
    description: 'Tax configuration created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateTaxConfigDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.taxConfigService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List all tax configurations' })
  @ApiResponse({
    status: 200,
    description: 'Tax configurations retrieved successfully',
  })
  findAll(@CurrentUser('tenantId') tenantId: number) {
    return this.taxConfigService.findAllByTenant(tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get a tax configuration by UUID' })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  @ApiParam({ name: 'uuid', description: 'Tax configuration UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.taxConfigService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Update a tax configuration' })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  @ApiParam({ name: 'uuid', description: 'Tax configuration UUID' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateTaxConfigDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.taxConfigService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a tax configuration' })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  @ApiParam({ name: 'uuid', description: 'Tax configuration UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.taxConfigService.remove(uuid, tenantId);
  }
}
