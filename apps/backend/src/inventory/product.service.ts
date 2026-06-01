import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { Category } from './entities/category.entity.js';
import { CreateProductDto, UpdateProductDto } from './dto/index.js';
import { InventoryEventsService } from './inventory-events.service.js';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly eventsService: InventoryEventsService,
  ) {}

  async create(dto: CreateProductDto, tenantId: number): Promise<Product> {
    // Validate category exists for this tenant
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId, tenantId },
    });
    if (!category)
      throw new BadRequestException(
        `Category with id ${dto.categoryId} not found`,
      );

    // Check SKU uniqueness within tenant
    const existing = await this.productRepo.findOne({
      where: { sku: dto.sku, tenantId },
    });
    if (existing)
      throw new ConflictException(`SKU "${dto.sku}" already exists`);

    const product = this.productRepo.create({ ...dto, tenantId });
    const saved = await this.productRepo.save(product);
    this.eventsService.emit({
      type: 'product_created',
      tenantId,
      entityId: saved.id,
      uuid: saved.uuid,
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async findAllByTenant(tenantId: number, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { tenantId, name: ILike(`%${search}%`) },
          { tenantId, sku: ILike(`%${search}%`) },
        ]
      : [{ tenantId }];

    const [data, total] = await this.productRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByCategory(
    categoryId: number,
    tenantId: number,
    page = 1,
    limit = 50,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { categoryId, tenantId, name: ILike(`%${search}%`) },
          { categoryId, tenantId, sku: ILike(`%${search}%`) },
        ]
      : [{ categoryId, tenantId }];

    const [data, total] = await this.productRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    uuid: string,
    dto: UpdateProductDto,
    tenantId: number,
  ): Promise<Product> {
    const product = await this.findOneByUuid(uuid, tenantId);

    // Check SKU uniqueness if being changed
    if (dto.sku && dto.sku !== product.sku) {
      const conflict = await this.productRepo.findOne({
        where: { sku: dto.sku, tenantId },
      });
      if (conflict)
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    Object.assign(product, dto);
    const saved = await this.productRepo.save(product);
    this.eventsService.emit({
      type: 'product_updated',
      tenantId,
      entityId: saved.id,
      uuid: saved.uuid,
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const product = await this.findOneByUuid(uuid, tenantId);
    await this.productRepo.softRemove(product);
    this.eventsService.emit({
      type: 'product_deleted',
      tenantId,
      entityId: product.id,
      uuid: product.uuid,
      timestamp: new Date().toISOString(),
    });
  }
}
