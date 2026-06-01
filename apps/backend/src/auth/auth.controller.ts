import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthenticatedUserClaims } from './types/request-context.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Auth health check' })
  @ApiResponse({ status: 200, description: 'Auth module is running' })
  health() {
    return { status: 'ok' };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user profile',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: AuthenticatedUserClaims) {
    return {
      uid: user.uid,
      email: user.email,
      role: user.role ?? null,
    };
  }

  /** Self-service registration: creates a Tenant + first TENANT_ADMIN user. Requires a valid Firebase JWT (no role needed). */
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant and admin user' })
  @ApiResponse({
    status: 201,
    description: 'Tenant and admin user created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Duplicate registration' })
  register(
    @CurrentUser('uid') uid: string,
    @CurrentUser('email') email: string,
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(uid, email, dto);
  }
}
