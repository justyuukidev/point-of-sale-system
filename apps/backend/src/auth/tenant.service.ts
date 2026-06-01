import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { CreateTenantDto, UpdateTenantDto } from './dto/index.js';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepo.create(dto);
    // Temporarily set tenantId to 0; will self-reference after insert
    tenant.tenantId = 0;
    const saved = await this.tenantRepo.save(tenant);
    // Self-referencing: tenant owns itself. Use raw SQL update to avoid
    // tenant-subscriber cross-tenant checks on the follow-up write.
    await this.tenantRepo.query(
      'UPDATE tenants SET "tenantId" = $1 WHERE id = $1',
      [saved.id],
    );
    saved.tenantId = saved.id;
    return saved;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find();
  }

  async findByTenantId(tenantId: number): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant not found`);
    return tenant;
  }

  async findOneByUuid(uuid: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { uuid } });
    if (!tenant) throw new NotFoundException(`Tenant not found`);
    return tenant;
  }

  async update(uuid: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOneByUuid(uuid);
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async remove(uuid: string): Promise<void> {
    const tenant = await this.findOneByUuid(uuid);
    await this.tenantRepo.softRemove(tenant);
  }
}
