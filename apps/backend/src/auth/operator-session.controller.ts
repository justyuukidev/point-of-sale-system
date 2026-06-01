import {
  Controller,
  Post,
  Get,
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
import { OperatorSessionService } from './operator-session.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { IsString, MinLength, MaxLength, IsInt } from 'class-validator';

class SwitchOperatorDto {
  @IsString()
  deviceUuid!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  pin!: string;
}

class SetPinDto {
  @IsInt()
  userId!: number;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  pin!: string;
}

@ApiTags('Operator Sessions')
@ApiBearerAuth('firebase-jwt')
@Controller('operator-sessions')
export class OperatorSessionController {
  constructor(
    private readonly operatorSessionService: OperatorSessionService,
  ) {}

  // ─── PIN Management ─────────────────────────────────────────────────────────

  @Post('pin')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Set or update a user PIN (admin/manager only)' })
  @ApiResponse({ status: 200, description: 'PIN set successfully' })
  async setPin(
    @Body() dto: SetPinDto,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    await this.operatorSessionService.setPin(dto.userId, dto.pin, tenantId);
    return { message: 'PIN set successfully' };
  }

  @Delete('pin/:userId')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Remove a user PIN' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'PIN removed successfully' })
  async removePin(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    await this.operatorSessionService.removePin(userId, tenantId);
    return { message: 'PIN removed successfully' };
  }

  @Get('operators')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER')
  @ApiOperation({ summary: 'List operators for a store with PIN status' })
  @ApiQuery({ name: 'storeId', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns operator list with PIN status',
  })
  async listOperators(
    @Query('storeId', ParseIntPipe) storeId: number,
    @CurrentUser('tenantId') tenantId: number,
  ) {
    return this.operatorSessionService.listOperators(storeId, tenantId);
  }

  // ─── Session Management ─────────────────────────────────────────────────────

  @Post('switch')
  @ApiOperation({ summary: 'Switch active operator on a device via PIN' })
  @ApiResponse({ status: 200, description: 'Operator switched successfully' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  switchOperator(
    @CurrentUser('tenantId') tenantId: number,
    @Body() dto: SwitchOperatorDto,
  ) {
    return this.operatorSessionService.switchOperator(
      tenantId,
      dto.deviceUuid,
      dto.pin,
    );
  }

  @Delete(':deviceUuid')
  @ApiOperation({ summary: 'End active operator session on a device' })
  @ApiParam({ name: 'deviceUuid', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  endSession(
    @CurrentUser('tenantId') tenantId: number,
    @Param('deviceUuid', ParseUUIDPipe) deviceUuid: string,
  ) {
    return this.operatorSessionService.endSession(tenantId, deviceUuid);
  }

  @Get('device/:deviceUuid')
  @ApiOperation({ summary: 'Get current operator on a device' })
  @ApiParam({ name: 'deviceUuid', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'Returns active operator or null' })
  getActiveOperator(
    @CurrentUser('tenantId') tenantId: number,
    @Param('deviceUuid', ParseUUIDPipe) deviceUuid: string,
  ) {
    return this.operatorSessionService.getActiveOperator(tenantId, deviceUuid);
  }

  @Get()
  @ApiOperation({
    summary: 'List all active device sessions for tenant (admin view)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all active operator sessions across devices',
  })
  getAllActiveSessions(@CurrentUser('tenantId') tenantId: number) {
    return this.operatorSessionService.getAllActiveSessions(tenantId);
  }
}
