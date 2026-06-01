import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  OperationLog,
  OperationAction,
} from './entities/operation-log.entity.js';

export interface OperationLogQuery {
  tenantId: number;
  entityType?: string;
  entityId?: number;
  action?: OperationAction;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly repo: Repository<OperationLog>,
  ) {}

  async findAll(
    query: OperationLogQuery,
  ): Promise<{ data: OperationLog[]; total: number }> {
    const {
      tenantId,
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
      skip: offset,
    });

    return { data, total };
  }

  async findByEntity(
    tenantId: number,
    entityType: string,
    entityId: number,
  ): Promise<OperationLog[]> {
    return this.repo.find({
      where: { tenantId, entityType, entityId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
