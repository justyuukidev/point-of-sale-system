import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchItem } from './entities/dispatch-item.entity.js';
import { Dispatch } from './entities/dispatch.entity.js';
import { Batch } from './entities/batch.entity.js';
import { CreateDispatchItemDto, UpdateDispatchItemDto } from './dto/index.js';
import { DispatchStatus } from '../shared/enums/index.js';

@Injectable()
export class DispatchItemService {
  constructor(
    @InjectRepository(DispatchItem)
    private readonly dispatchItemRepo: Repository<DispatchItem>,
    @InjectRepository(Dispatch)
    private readonly dispatchRepo: Repository<Dispatch>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  async create(
    dto: CreateDispatchItemDto,
    tenantId: number,
  ): Promise<DispatchItem> {
    // Verify dispatch exists and is in PENDING status
    const dispatch = await this.dispatchRepo.findOne({
      where: { id: dto.dispatchId, tenantId },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== DispatchStatus.PENDING) {
      throw new BadRequestException('Can only add items to pending dispatches');
    }

    // Verify batch exists and has the product
    const batch = await this.batchRepo.findOne({
      where: { id: dto.batchId, tenantId },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const item = this.dispatchItemRepo.create({
      ...dto,
      productId: batch.productId,
      tenantId,
    });
    return this.dispatchItemRepo.save(item);
  }

  async findByDispatch(
    dispatchId: number,
    tenantId: number,
  ): Promise<DispatchItem[]> {
    return this.dispatchItemRepo.find({
      where: { dispatchId, tenantId },
      order: { id: 'ASC' },
    });
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<DispatchItem> {
    const item = await this.dispatchItemRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!item) throw new NotFoundException('Dispatch item not found');
    return item;
  }

  async update(
    uuid: string,
    dto: UpdateDispatchItemDto,
    tenantId: number,
  ): Promise<DispatchItem> {
    const item = await this.findOneByUuid(uuid, tenantId);
    Object.assign(item, dto);
    return this.dispatchItemRepo.save(item);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const item = await this.findOneByUuid(uuid, tenantId);

    // Verify parent dispatch is still PENDING
    const dispatch = await this.dispatchRepo.findOne({
      where: { id: item.dispatchId, tenantId },
    });
    if (dispatch && dispatch.status !== DispatchStatus.PENDING) {
      throw new BadRequestException(
        'Cannot remove items from non-pending dispatches',
      );
    }

    await this.dispatchItemRepo.softRemove(item);
  }
}
