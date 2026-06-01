import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
  DataSource,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity.js';
import { TenantContextService } from '../common/tenant-context/tenant-context.service.js';
import {
  OperationLog,
  OperationAction,
} from './entities/operation-log.entity.js';

/** Fields to exclude from change tracking (noisy/internal) */
const EXCLUDED_FIELDS = new Set([
  'updatedAt',
  'createdAt',
  'deletedAt',
  'updatedBy',
  'createdBy',
]);

@Injectable()
export class OperationLogSubscriber
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

  async afterInsert(event: InsertEvent<BaseEntity>): Promise<void> {
    const entity = event.entity;
    if (!entity || entity instanceof OperationLog) return;

    try {
      await this.logOperation(event.manager, {
        action: OperationAction.CREATE,
        entity,
        entityType: event.metadata.name,
      });
    } catch (error) {
      // Don't let logging failures break the main operation
      console.error('[OperationLog] Failed to log INSERT:', error);
    }
  }

  async afterUpdate(event: UpdateEvent<BaseEntity>): Promise<void> {
    const entity = event.entity as BaseEntity | undefined;
    if (!entity || entity instanceof OperationLog) return;

    try {
      // event.entity may be partial (only updated fields) — get id from databaseEntity if missing
      const resolvedId = entity.id ?? event.databaseEntity?.id ?? null;
      const changes = this.computeChanges(event.databaseEntity, entity);
      await this.logOperation(event.manager, {
        action: OperationAction.UPDATE,
        entity,
        entityType: event.metadata.name,
        changes: Object.keys(changes).length > 0 ? changes : null,
        entityIdOverride: resolvedId,
      });
    } catch (error) {
      console.error('[OperationLog] Failed to log UPDATE:', error);
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<BaseEntity>): Promise<void> {
    const entity = event.entity;
    if (!entity || entity instanceof OperationLog) return;

    try {
      await this.logOperation(event.manager, {
        action: OperationAction.DELETE,
        entity,
        entityType: event.metadata.name,
      });
    } catch (error) {
      console.error('[OperationLog] Failed to log DELETE:', error);
    }
  }

  private async logOperation(
    manager: any,
    opts: {
      action: OperationAction;
      entity: BaseEntity;
      entityType: string;
      changes?: Record<string, unknown> | null;
      entityIdOverride?: number | null;
    },
  ): Promise<void> {
    const { action, entity, entityType, changes, entityIdOverride } = opts;

    const resolvedId =
      entityIdOverride !== undefined ? entityIdOverride : entity.id;

    // Skip logging if entity has no ID (e.g. partial update without primary key loaded)
    if (resolvedId == null) {
      console.warn(
        `[OperationLog] Skipping ${action} on ${entityType}: entity.id is null`,
      );
      return;
    }

    const store = this.tenantContext.getStore();

    const log = new OperationLog();
    log.tenantId = entity.tenantId ?? store?.tenantId ?? 0;
    log.userId = store?.userId ?? null;
    log.entityType = entityType;
    log.entityId = resolvedId;
    log.entityUuid = entity.uuid ?? null;
    log.action = action;
    log.changes = changes ?? null;
    log.metadata = null;

    await manager.getRepository(OperationLog).save(log);
  }

  private computeChanges(
    oldEntity: any,
    newEntity: any,
  ): Record<string, { old: unknown; new: unknown }> {
    if (!oldEntity || !newEntity) return {};

    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const key of Object.keys(newEntity)) {
      if (EXCLUDED_FIELDS.has(key)) continue;
      if (key.startsWith('__')) continue;

      const oldVal = oldEntity[key];
      const newVal = newEntity[key];

      // Skip objects/relations
      if (
        typeof newVal === 'object' &&
        newVal !== null &&
        !(newVal instanceof Date)
      )
        continue;

      // Compare values (handle Date comparison)
      const oldStr =
        oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? '');
      const newStr =
        newVal instanceof Date ? newVal.toISOString() : String(newVal ?? '');

      if (oldStr !== newStr) {
        changes[key] = { old: oldVal ?? null, new: newVal ?? null };
      }
    }

    return changes;
  }
}
