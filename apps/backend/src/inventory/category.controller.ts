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
import { CategoryService } from './category.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Categories')
@ApiBearerAuth('firebase-jwt')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.categoryService.create(dto, tenantId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER')
  @ApiOperation({ summary: 'List all categories for the tenant' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by category name',
  })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.categoryService.findAllByTenant(
      tenantId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search,
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER')
  @ApiOperation({ summary: 'Get a category by UUID' })
  @ApiParam({ name: 'uuid', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.categoryService.findOneByUuid(uuid, tenantId);
  }

  @Patch(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'uuid', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.categoryService.update(uuid, dto, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'uuid', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.categoryService.remove(uuid, tenantId);
  }
}
