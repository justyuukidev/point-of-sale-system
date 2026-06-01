import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity.js';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
  ) {}

  async create(dto: CreateWarehouseDto, tenantId: number): Promise<Warehouse> {
    const warehouse = this.warehouseRepo.create({ ...dto, tenantId });
    return this.warehouseRepo.save(warehouse);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.warehouseRepo,
      { where: { tenantId } },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(
    uuid: string,
    dto: UpdateWarehouseDto,
    tenantId: number,
  ): Promise<Warehouse> {
    const warehouse = await this.findOneByUuid(uuid, tenantId);
    Object.assign(warehouse, dto);
    return this.warehouseRepo.save(warehouse);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const warehouse = await this.findOneByUuid(uuid, tenantId);
    await this.warehouseRepo.softRemove(warehouse);
  }
}
