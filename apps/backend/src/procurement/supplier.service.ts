import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto, tenantId: number): Promise<Supplier> {
    const existing = await this.supplierRepo.findOne({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new ConflictException(
        'Supplier name already exists for this tenant',
      );

    const supplier = this.supplierRepo.create({ ...dto, tenantId });
    return this.supplierRepo.save(supplier);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.supplierRepo,
      {
        where: { tenantId },
        order: { name: 'ASC' },
      },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(
    uuid: string,
    dto: UpdateSupplierDto,
    tenantId: number,
  ): Promise<Supplier> {
    const supplier = await this.findOneByUuid(uuid, tenantId);
    Object.assign(supplier, dto);
    return this.supplierRepo.save(supplier);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const supplier = await this.findOneByUuid(uuid, tenantId);
    await this.supplierRepo.softRemove(supplier);
  }
}
