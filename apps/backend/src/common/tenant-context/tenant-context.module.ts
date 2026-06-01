import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantContextService } from './tenant-context.service.js';
import { TenantInterceptor } from './tenant.interceptor.js';
import { TenantSubscriber } from './tenant.subscriber.js';

@Global()
@Module({
  providers: [
    TenantContextService,
    TenantSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantContextService],
})
export class TenantContextModule {}
