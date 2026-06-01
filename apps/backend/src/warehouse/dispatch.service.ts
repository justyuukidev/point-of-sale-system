import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Dispatch } from './entities/dispatch.entity.js';
import { DispatchItem } from './entities/dispatch-item.entity.js';
import { Batch } from './entities/batch.entity.js';
import { CreateDispatchDto, UpdateDispatchDto } from './dto/index.js';
import { DispatchStatus } from '../shared/enums/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

/** Valid dispatch status transitions */
const VALID_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  [DispatchStatus.PENDING]: [
    DispatchStatus.DISPATCHED,
    DispatchStatus.CANCELLED,
  ],
  [DispatchStatus.DISPATCHED]: [DispatchStatus.RECEIVED],
  [DispatchStatus.RECEIVED]: [],
  [DispatchStatus.CANCELLED]: [],
};

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Dispatch)
    private readonly dispatchRepo: Repository<Dispatch>,
    @InjectRepository(DispatchItem)
    private readonly dispatchItemRepo: Repository<DispatchItem>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateDispatchDto,
    tenantId: number,
    dispatchedById: number,
  ): Promise<Dispatch> {
    const dispatch = this.dispatchRepo.create({
      ...dto,
      dispatchedById,
      status: DispatchStatus.PENDING,
      tenantId,
    });
    return this.dispatchRepo.save(dispatch);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.dispatchRepo,
      {
        where: { tenantId },
        order: { dispatchDate: 'DESC', id: 'DESC' },
      },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Dispatch> {
    const dispatch = await this.dispatchRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async update(
    uuid: string,
    dto: UpdateDispatchDto,
    tenantId: number,
    operatorId?: number,
  ): Promise<Dispatch> {
    const dispatch = await this.findOneByUuid(uuid, tenantId);

    // Validate status transition
    if (dto.status && dto.status !== dispatch.status) {
      const allowed = VALID_TRANSITIONS[dispatch.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${dispatch.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      // Business logic for DISPATCHED transition
      if (dto.status === DispatchStatus.DISPATCHED) {
        await this.processDispatch(dispatch, tenantId);
      }
    }

    Object.assign(dispatch, dto);
    if (dto.status === DispatchStatus.DISPATCHED && operatorId) {
      dispatch.dispatchedById = operatorId;
    }
    return this.dispatchRepo.save(dispatch);
  }

  /**
   * When marking as DISPATCHED: deduct from batch remainingQuantity atomically.
   */
  private async processDispatch(
    dispatch: Dispatch,
    tenantId: number,
  ): Promise<void> {
    const items = await this.dispatchItemRepo.find({
      where: { dispatchId: dispatch.id, tenantId },
    });

    if (items.length === 0) {
      throw new BadRequestException('Cannot dispatch without items');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        // Lock and deduct batch remaining quantity
        const result = await manager.query(
          `UPDATE batches
           SET "remainingQuantity" = "remainingQuantity" - $1
           WHERE id = $2 AND "tenantId" = $3 AND "deletedAt" IS NULL
             AND "remainingQuantity" >= $1
           RETURNING "remainingQuantity"`,
          [item.quantity, item.batchId, tenantId],
        );
        if (result.length === 0) {
          const batch = await manager.findOne(Batch, {
            where: { id: item.batchId, tenantId },
          });
          throw new BadRequestException(
            `Insufficient batch quantity for batch ${batch?.batchNumber ?? item.batchId}. Requested: ${item.quantity}, available: ${batch?.remainingQuantity ?? 0}`,
          );
        }
      }
    });
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const dispatch = await this.findOneByUuid(uuid, tenantId);
    if (dispatch.status !== DispatchStatus.PENDING) {
      throw new BadRequestException('Can only delete pending dispatches');
    }
    await this.dispatchRepo.softRemove(dispatch);
  }
}
