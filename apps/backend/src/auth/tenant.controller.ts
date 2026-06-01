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
import { TenantService } from './tenant.service.js';
import { CreateTenantDto, UpdateTenantDto } from './dto/index.js';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Tenants')
@ApiBearerAuth('firebase-jwt')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({ status: 200, description: 'Returns all tenants' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get('me')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: "Get the current user's tenant" })
  @ApiResponse({
    status: 200,
    description: 'Returns the tenant for the authenticated user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findMe(@CurrentUser('tenantId') tenantId: number) {
    return this.tenantService.findByTenantId(tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Get a tenant by UUID' })
  @ApiParam({ name: 'uuid', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Returns the tenant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.tenantService.findOneByUuid(uuid);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiParam({ name: 'uuid', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(uuid, dto);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiParam({ name: 'uuid', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – requires TENANT_ADMIN role',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.tenantService.remove(uuid);
  }
}
