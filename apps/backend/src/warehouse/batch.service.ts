import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity.js';
import { CreateBatchDto, UpdateBatchDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  async create(dto: CreateBatchDto, tenantId: number): Promise<Batch> {
    const batch = this.batchRepo.create({ ...dto, tenantId });
    return this.batchRepo.save(batch);
  }

  async findAllByTenant(
    tenantId: number,
    pagination: PaginationQueryDto,
    warehouseId?: number,
  ) {
    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    return paginate(
      this.batchRepo,
      { where, order: { deliveryDate: 'DESC', id: 'DESC' } },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Batch> {
    const batch = await this.batchRepo.findOne({ where: { uuid, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async update(
    uuid: string,
    dto: UpdateBatchDto,
    tenantId: number,
  ): Promise<Batch> {
    const batch = await this.findOneByUuid(uuid, tenantId);
    Object.assign(batch, dto);
    return this.batchRepo.save(batch);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const batch = await this.findOneByUuid(uuid, tenantId);
    await this.batchRepo.softRemove(batch);
  }
}
