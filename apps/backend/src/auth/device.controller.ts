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
import { DeviceService } from './device.service.js';
import { RegisterDeviceDto } from './dto/index.js';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Devices')
@ApiBearerAuth('firebase-jwt')
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  register(
    @CurrentUser('tenantId') tenantId: number,
    @CurrentUser('dbUserId') userId: number,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.deviceService.register(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List devices for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all devices for the authenticated user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMyDevices(@CurrentUser('dbUserId') userId: number) {
    return this.deviceService.findByUser(userId);
  }

  @Patch(':uuid/deactivate')
  @ApiOperation({ summary: 'Deactivate a device' })
  @ApiParam({ name: 'uuid', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'Device deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  deactivate(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.deviceService.deactivate(uuid);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiParam({ name: 'uuid', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.deviceService.remove(uuid);
  }
}
