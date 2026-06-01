import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ReceiptService } from './receipt.service.js';
import { CreateReceiptDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { RequestWithAuth } from '../auth/types/request-context.js';

@ApiTags('Receipts')
@ApiBearerAuth('firebase-jwt')
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Generate a receipt' })
  @ApiResponse({ status: 201, description: 'Receipt generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateReceiptDto,
    @CurrentUser('tenantId') tenantId: number,
    @Req() req: RequestWithAuth,
  ) {
    // Prefer operator name (set by OperatorContextInterceptor), fall back to token email
    const operator = req.operator;
    const cashierName = operator
      ? `${operator.firstName ?? ''} ${operator.lastName ?? ''}`.trim() ||
        operator.username ||
        'Unknown'
      : (req.user?.email ?? 'Unknown');
    return this.receiptService.create(dto, tenantId, cashierName);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List all receipts' })
  @ApiResponse({ status: 200, description: 'Receipts retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.receiptService.findAllByTenant(tenantId, pagination);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a receipt by UUID' })
  @ApiResponse({ status: 200, description: 'Receipt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  @ApiParam({ name: 'uuid', description: 'Receipt UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.receiptService.findOneByUuid(uuid, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a receipt' })
  @ApiResponse({ status: 200, description: 'Receipt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  @ApiParam({ name: 'uuid', description: 'Receipt UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.receiptService.remove(uuid, tenantId);
  }
}
