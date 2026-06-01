import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity.js';
import { CreateStoreDto, UpdateStoreDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async create(dto: CreateStoreDto, tenantId: number): Promise<Store> {
    const store = this.storeRepo.create({ ...dto, tenantId });
    return this.storeRepo.save(store);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.storeRepo,
      { where: { tenantId } },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { uuid, tenantId } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(
    uuid: string,
    dto: UpdateStoreDto,
    tenantId: number,
  ): Promise<Store> {
    const store = await this.findOneByUuid(uuid, tenantId);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const store = await this.findOneByUuid(uuid, tenantId);
    await this.storeRepo.softRemove(store);
  }
}
