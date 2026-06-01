import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReceivingRecord } from './entities/receiving-record.entity.js';
import { Dispatch } from './entities/dispatch.entity.js';
import { DispatchItem } from './entities/dispatch-item.entity.js';
import {
  CreateReceivingRecordDto,
  UpdateReceivingRecordDto,
} from './dto/index.js';
import {
  ReceivingRecordStatus,
  DispatchStatus,
} from '../shared/enums/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

/** Valid receiving status transitions */
const VALID_TRANSITIONS: Record<
  ReceivingRecordStatus,
  ReceivingRecordStatus[]
> = {
  [ReceivingRecordStatus.PENDING]: [
    ReceivingRecordStatus.PARTIAL,
    ReceivingRecordStatus.COMPLETE,
    ReceivingRecordStatus.DISPUTED,
  ],
  [ReceivingRecordStatus.PARTIAL]: [
    ReceivingRecordStatus.COMPLETE,
    ReceivingRecordStatus.DISPUTED,
  ],
  [ReceivingRecordStatus.COMPLETE]: [],
  [ReceivingRecordStatus.DISPUTED]: [ReceivingRecordStatus.COMPLETE],
};

@Injectable()
export class ReceivingRecordService {
  constructor(
    @InjectRepository(ReceivingRecord)
    private readonly rrRepo: Repository<ReceivingRecord>,
    @InjectRepository(Dispatch)
    private readonly dispatchRepo: Repository<Dispatch>,
    @InjectRepository(DispatchItem)
    private readonly dispatchItemRepo: Repository<DispatchItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateReceivingRecordDto,
    tenantId: number,
    receivedById: number,
  ): Promise<ReceivingRecord> {
    // Verify dispatch exists and is in DISPATCHED status
    const dispatch = await this.dispatchRepo.findOne({
      where: { id: dto.dispatchId, tenantId },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== DispatchStatus.DISPATCHED) {
      throw new BadRequestException(
        'Can only receive dispatches with DISPATCHED status',
      );
    }

    const rr = this.rrRepo.create({
      ...dto,
      receivedById,
      status: ReceivingRecordStatus.PENDING,
      tenantId,
    });
    return this.rrRepo.save(rr);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.rrRepo,
      {
        where: { tenantId },
        order: { receivedDate: 'DESC', id: 'DESC' },
      },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<ReceivingRecord> {
    const rr = await this.rrRepo.findOne({ where: { uuid, tenantId } });
    if (!rr) throw new NotFoundException('Receiving record not found');
    return rr;
  }

  async update(
    uuid: string,
    dto: UpdateReceivingRecordDto,
    tenantId: number,
    operatorId?: number,
  ): Promise<ReceivingRecord> {
    const rr = await this.findOneByUuid(uuid, tenantId);

    // Validate status transition
    if (dto.status && dto.status !== rr.status) {
      const allowed = VALID_TRANSITIONS[rr.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${rr.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      // Business logic for COMPLETE transition — update store stock levels
      if (dto.status === ReceivingRecordStatus.COMPLETE) {
        await this.processReceiving(rr, tenantId);
      }
    }

    Object.assign(rr, dto);
    if (operatorId) rr.receivedById = operatorId;
    return this.rrRepo.save(rr);
  }

  /**
   * When marking as COMPLETE: add dispatched quantities to store stock levels.
   * Also marks the parent dispatch as RECEIVED.
   */
  private async processReceiving(
    rr: ReceivingRecord,
    tenantId: number,
  ): Promise<void> {
    const dispatch = await this.dispatchRepo.findOne({
      where: { id: rr.dispatchId, tenantId },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');

    const items = await this.dispatchItemRepo.find({
      where: { dispatchId: dispatch.id, tenantId },
    });

    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        // Add to store stock level (upsert)
        const existing = await manager.query(
          `SELECT id FROM stock_levels
           WHERE "storeId" = $1 AND "productId" = $2 AND "tenantId" = $3 AND "deletedAt" IS NULL`,
          [rr.storeId, item.productId, tenantId],
        );

        if (existing.length > 0) {
          await manager.query(
            `UPDATE stock_levels
             SET "currentQuantity" = "currentQuantity" + $1, "lastRestockedAt" = NOW()
             WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL`,
            [item.quantity, rr.storeId, item.productId, tenantId],
          );
        } else {
          await manager.query(
            `INSERT INTO stock_levels (uuid, "storeId", "productId", "tenantId", "currentQuantity", "initialQuantity", "lastRestockedAt", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $4, NOW(), NOW(), NOW())`,
            [rr.storeId, item.productId, tenantId, item.quantity],
          );
        }

        // Mark quantityReceived on dispatch item
        item.quantityReceived = item.quantity;
        await manager.save(DispatchItem, item);
      }

      // Mark dispatch as RECEIVED
      dispatch.status = DispatchStatus.RECEIVED;
      await manager.save(Dispatch, dispatch);
    });
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const rr = await this.findOneByUuid(uuid, tenantId);
    if (rr.status === ReceivingRecordStatus.COMPLETE) {
      throw new BadRequestException(
        'Cannot delete completed receiving records',
      );
    }
    await this.rrRepo.softRemove(rr);
  }
}
