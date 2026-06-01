import {
  Controller,
  Get,
  Post,
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
import { ZReadingService } from './z-reading.service.js';
import { GenerateZReadingDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Z-Readings')
@ApiBearerAuth('firebase-jwt')
@Controller('z-readings')
export class ZReadingController {
  constructor(private readonly zReadingService: ZReadingService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Generate a Z-reading report' })
  @ApiResponse({ status: 201, description: 'Z-reading generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generate(
    @Body() dto: GenerateZReadingDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.zReadingService.generate(dto, tenantId, userId ?? 1);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List Z-reading reports' })
  @ApiResponse({
    status: 200,
    description: 'Z-readings retrieved successfully',
  })
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
    return this.zReadingService.findAllByTenant(
      tenantId,
      storeId ? parseInt(storeId, 10) : undefined,
      pagination,
    );
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get a Z-reading by UUID' })
  @ApiResponse({ status: 200, description: 'Z-reading retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Z-reading not found' })
  @ApiParam({ name: 'uuid', description: 'Z-reading UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.zReadingService.findOneByUuid(uuid, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a Z-reading' })
  @ApiResponse({ status: 200, description: 'Z-reading deleted successfully' })
  @ApiResponse({ status: 404, description: 'Z-reading not found' })
  @ApiParam({ name: 'uuid', description: 'Z-reading UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.zReadingService.remove(uuid, tenantId);
  }
}
