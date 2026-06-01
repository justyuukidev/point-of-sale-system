import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CashDrawerEventService } from './cash-drawer-event.service.js';
import { CreateCashDrawerEventDto } from './dto/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Cash Drawer Events')
@ApiBearerAuth('firebase-jwt')
@Controller('cash-drawer-events')
export class CashDrawerEventController {
  constructor(private readonly eventService: CashDrawerEventService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Create a cash drawer event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateCashDrawerEventDto,
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('operatorId') operatorId: number,
  ) {
    return this.eventService.create(dto, tenantId, operatorId);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'List cash drawer events by session' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({
    name: 'sessionUuid',
    required: true,
    description: 'Cash register session UUID',
  })
  findBySession(
    @Query('sessionUuid') sessionUuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    if (!sessionUuid) {
      throw new BadRequestException('sessionUuid query parameter is required');
    }
    return this.eventService.findBySession(sessionUuid, tenantId);
  }

  @Get(':uuid')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Get a cash drawer event by UUID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'uuid', description: 'Event UUID' })
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.eventService.findOneByUuid(uuid, tenantId);
  }

  @Delete(':uuid')
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Delete a cash drawer event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'uuid', description: 'Event UUID' })
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.eventService.remove(uuid, tenantId);
  }
}
