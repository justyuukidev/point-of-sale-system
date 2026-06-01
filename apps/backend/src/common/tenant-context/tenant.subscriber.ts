import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity.js';
import { TenantContextService } from './tenant-context.service.js';

@Injectable()
export class TenantSubscriber
  implements EntitySubscriberInterface<BaseEntity>, OnModuleInit
{
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<BaseEntity>): void {
    const entity = event.entity;
    if (!entity) return;

    const tenantId = this.tenantContext.getTenantId();
    if (tenantId && !entity.tenantId) {
      // Auto-stamp tenantId if not already set
      entity.tenantId = tenantId;
    }
  }

  beforeUpdate(event: UpdateEvent<BaseEntity>): void {
    const entity = event.entity as BaseEntity | undefined;
    if (!entity) return;

    const tenantId = this.tenantContext.getTenantId();
    if (tenantId && entity.tenantId && entity.tenantId !== tenantId) {
      // Prevent cross-tenant updates
      throw new Error(
        `Tenant isolation violation: user tenant ${tenantId} cannot modify entity belonging to tenant ${entity.tenantId}`,
      );
    }
  }
}
