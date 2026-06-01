import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { InventoryEventsService } from './inventory-events.service.js';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly eventsService: InventoryEventsService,
  ) {}

  async create(dto: CreateCategoryDto, tenantId: number): Promise<Category> {
    const category = this.categoryRepo.create({ ...dto, tenantId });
    const saved = await this.categoryRepo.save(category);
    this.eventsService.emit({
      type: 'category_created',
      tenantId,
      entityId: saved.id,
      uuid: saved.uuid,
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async findAllByTenant(tenantId: number, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? { tenantId, name: ILike(`%${search}%`) }
      : { tenantId };

    const [data, total] = await this.categoryRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(
    uuid: string,
    dto: UpdateCategoryDto,
    tenantId: number,
  ): Promise<Category> {
    const category = await this.findOneByUuid(uuid, tenantId);
    Object.assign(category, dto);
    const saved = await this.categoryRepo.save(category);
    this.eventsService.emit({
      type: 'category_updated',
      tenantId,
      entityId: saved.id,
      uuid: saved.uuid,
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const category = await this.findOneByUuid(uuid, tenantId);
    await this.categoryRepo.softRemove(category);
    this.eventsService.emit({
      type: 'category_deleted',
      tenantId,
      entityId: category.id,
      uuid: category.uuid,
      timestamp: new Date().toISOString(),
    });
  }
}
