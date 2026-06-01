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
} from '@nestjs/swagger';
import { ModifierService } from './modifier.service.js';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
  CreateProductModifierGroupDto,
  CreateProductModifierPriceDto,
} from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Modifiers')
@ApiBearerAuth('firebase-jwt')
@Controller('modifiers')
export class ModifierController {
  constructor(private readonly modifierService: ModifierService) {}

  // ─── Groups ──────────────────────────────────────────────────────────────────

  @Post('groups')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Create a modifier group' })
  @ApiResponse({ status: 201, description: 'Group created' })
  createGroup(
    @Body() dto: CreateModifierGroupDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.createGroup(dto, tenantId);
  }

  @Get('groups')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List all modifier groups' })
  findAllGroups(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.modifierService.findAllGroups(tenantId, pagination);
  }

  @Get('groups/:uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a modifier group by UUID' })
  @ApiParam({ name: 'uuid', description: 'Modifier group UUID' })
  findGroupByUuid(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.findGroupByUuid(uuid, tenantId);
  }

  @Patch('groups/:uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Update a modifier group' })
  @ApiParam({ name: 'uuid', description: 'Modifier group UUID' })
  updateGroup(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateModifierGroupDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.updateGroup(uuid, dto, tenantId);
  }

  @Delete('groups/:uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a modifier group' })
  @ApiParam({ name: 'uuid', description: 'Modifier group UUID' })
  removeGroup(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.removeGroup(uuid, tenantId);
  }

  // ─── Options ─────────────────────────────────────────────────────────────────

  @Post('options')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Create a modifier option' })
  @ApiResponse({ status: 201, description: 'Option created' })
  createOption(
    @Body() dto: CreateModifierOptionDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.createOption(dto, tenantId);
  }

  @Get('options/by-group/:groupId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List options for a modifier group' })
  @ApiParam({ name: 'groupId', description: 'Modifier group ID' })
  findOptionsByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.findOptionsByGroup(groupId, tenantId);
  }

  @Get('options/:uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a modifier option by UUID' })
  @ApiParam({ name: 'uuid', description: 'Modifier option UUID' })
  findOptionByUuid(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.findOptionByUuid(uuid, tenantId);
  }

  @Patch('options/:uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Update a modifier option' })
  @ApiParam({ name: 'uuid', description: 'Modifier option UUID' })
  updateOption(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateModifierOptionDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.updateOption(uuid, dto, tenantId);
  }

  @Delete('options/:uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a modifier option' })
  @ApiParam({ name: 'uuid', description: 'Modifier option UUID' })
  removeOption(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.removeOption(uuid, tenantId);
  }

  // ─── Product-Group Assignment ────────────────────────────────────────────────

  @Post('product-groups')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Assign a modifier group to a product' })
  @ApiResponse({ status: 201, description: 'Assignment created' })
  assignGroupToProduct(
    @Body() dto: CreateProductModifierGroupDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.assignGroupToProduct(dto, tenantId);
  }

  @Get('product-groups/:productId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get modifier groups for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  findGroupsByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.findGroupsByProduct(productId, tenantId);
  }

  @Delete('product-groups/:productId/:modifierGroupId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Remove a modifier group from a product' })
  removeGroupFromProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('modifierGroupId', ParseIntPipe) modifierGroupId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.removeGroupFromProduct(
      productId,
      modifierGroupId,
      tenantId,
    );
  }

  // ─── Price Overrides ─────────────────────────────────────────────────────────

  @Post('prices')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({
    summary: 'Set per-product price override for a modifier option',
  })
  @ApiResponse({ status: 201, description: 'Price override set' })
  setProductModifierPrice(
    @Body() dto: CreateProductModifierPriceDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.setProductModifierPrice(dto, tenantId);
  }

  @Get('prices/:productId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get price overrides for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  findPriceOverrides(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.findPriceOverrides(productId, tenantId);
  }

  @Delete('prices/:productId/:modifierOptionId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Remove a per-product price override' })
  removeProductModifierPrice(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('modifierOptionId', ParseIntPipe) modifierOptionId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.modifierService.removeProductModifierPrice(
      productId,
      modifierOptionId,
      tenantId,
    );
  }
}
