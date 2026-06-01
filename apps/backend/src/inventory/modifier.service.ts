import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierGroup } from './entities/modifier-group.entity.js';
import { ModifierOption } from './entities/modifier-option.entity.js';
import { ProductModifierGroup } from './entities/product-modifier-group.entity.js';
import { ProductModifierPrice } from './entities/product-modifier-price.entity.js';
import { Product } from './entities/product.entity.js';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
  CreateProductModifierGroupDto,
  CreateProductModifierPriceDto,
} from './dto/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class ModifierService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly groupRepo: Repository<ModifierGroup>,
    @InjectRepository(ModifierOption)
    private readonly optionRepo: Repository<ModifierOption>,
    @InjectRepository(ProductModifierGroup)
    private readonly pmgRepo: Repository<ProductModifierGroup>,
    @InjectRepository(ProductModifierPrice)
    private readonly pmpRepo: Repository<ProductModifierPrice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ─── Modifier Groups ────────────────────────────────────────────────────────

  async createGroup(
    dto: CreateModifierGroupDto,
    tenantId: number,
  ): Promise<ModifierGroup> {
    const group = this.groupRepo.create({ ...dto, tenantId });
    return this.groupRepo.save(group);
  }

  async findAllGroups(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.groupRepo,
      {
        where: { tenantId },
        relations: ['options'],
        order: { sortOrder: 'ASC', name: 'ASC' },
      },
      pagination.page,
      pagination.limit,
    );
  }

  async findGroupByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<ModifierGroup> {
    const group = await this.groupRepo.findOne({
      where: { uuid, tenantId },
      relations: ['options'],
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return group;
  }

  async updateGroup(
    uuid: string,
    dto: UpdateModifierGroupDto,
    tenantId: number,
  ): Promise<ModifierGroup> {
    const group = await this.findGroupByUuid(uuid, tenantId);
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async removeGroup(uuid: string, tenantId: number): Promise<void> {
    const group = await this.findGroupByUuid(uuid, tenantId);
    await this.groupRepo.softRemove(group);
  }

  // ─── Modifier Options ───────────────────────────────────────────────────────

  async createOption(
    dto: CreateModifierOptionDto,
    tenantId: number,
  ): Promise<ModifierOption> {
    // Verify group exists
    const group = await this.groupRepo.findOne({
      where: { id: dto.modifierGroupId, tenantId },
    });
    if (!group) throw new NotFoundException('Modifier group not found');

    // Verify product exists if provided
    if (dto.productId) {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId, tenantId },
      });
      if (!product)
        throw new NotFoundException('Product not found for modifier link');
    }

    const option = this.optionRepo.create({
      ...dto,
      trackInventory: dto.trackInventory ?? dto.productId != null,
      tenantId,
    });
    return this.optionRepo.save(option);
  }

  async findOptionsByGroup(
    modifierGroupId: number,
    tenantId: number,
  ): Promise<ModifierOption[]> {
    return this.optionRepo.find({
      where: { modifierGroupId, tenantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOptionByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<ModifierOption> {
    const option = await this.optionRepo.findOne({ where: { uuid, tenantId } });
    if (!option) throw new NotFoundException('Modifier option not found');
    return option;
  }

  async updateOption(
    uuid: string,
    dto: UpdateModifierOptionDto,
    tenantId: number,
  ): Promise<ModifierOption> {
    const option = await this.findOptionByUuid(uuid, tenantId);
    Object.assign(option, dto);
    return this.optionRepo.save(option);
  }

  async removeOption(uuid: string, tenantId: number): Promise<void> {
    const option = await this.findOptionByUuid(uuid, tenantId);
    await this.optionRepo.softRemove(option);
  }

  // ─── Product-Modifier Group Assignment ──────────────────────────────────────

  async assignGroupToProduct(
    dto: CreateProductModifierGroupDto,
    tenantId: number,
  ): Promise<ProductModifierGroup> {
    // Verify product exists
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Verify group exists
    const group = await this.groupRepo.findOne({
      where: { id: dto.modifierGroupId, tenantId },
    });
    if (!group) throw new NotFoundException('Modifier group not found');

    // Check for duplicate
    const existing = await this.pmgRepo.findOne({
      where: {
        productId: dto.productId,
        modifierGroupId: dto.modifierGroupId,
        tenantId,
      },
    });
    if (existing)
      throw new ConflictException(
        'This modifier group is already assigned to this product',
      );

    const pmg = this.pmgRepo.create({ ...dto, tenantId });
    return this.pmgRepo.save(pmg);
  }

  async findGroupsByProduct(
    productId: number,
    tenantId: number,
  ): Promise<ProductModifierGroup[]> {
    return this.pmgRepo.find({
      where: { productId, tenantId },
      relations: ['modifierGroup', 'modifierGroup.options'],
      order: { sortOrder: 'ASC' },
    });
  }

  async removeGroupFromProduct(
    productId: number,
    modifierGroupId: number,
    tenantId: number,
  ): Promise<void> {
    const pmg = await this.pmgRepo.findOne({
      where: { productId, modifierGroupId, tenantId },
    });
    if (!pmg)
      throw new NotFoundException(
        'Product modifier group assignment not found',
      );
    await this.pmgRepo.softRemove(pmg);
  }

  // ─── Per-Product Price Overrides ────────────────────────────────────────────

  async setProductModifierPrice(
    dto: CreateProductModifierPriceDto,
    tenantId: number,
  ): Promise<ProductModifierPrice> {
    // Verify product and option exist
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const option = await this.optionRepo.findOne({
      where: { id: dto.modifierOptionId, tenantId },
    });
    if (!option) throw new NotFoundException('Modifier option not found');

    // Upsert: update existing or create new
    const existing = await this.pmpRepo.findOne({
      where: {
        productId: dto.productId,
        modifierOptionId: dto.modifierOptionId,
        tenantId,
      },
    });

    if (existing) {
      existing.priceAdjustment = dto.priceAdjustment;
      return this.pmpRepo.save(existing);
    }

    const pmp = this.pmpRepo.create({ ...dto, tenantId });
    return this.pmpRepo.save(pmp);
  }

  async findPriceOverrides(
    productId: number,
    tenantId: number,
  ): Promise<ProductModifierPrice[]> {
    return this.pmpRepo.find({
      where: { productId, tenantId },
      relations: ['modifierOption'],
    });
  }

  async removeProductModifierPrice(
    productId: number,
    modifierOptionId: number,
    tenantId: number,
  ): Promise<void> {
    const pmp = await this.pmpRepo.findOne({
      where: { productId, modifierOptionId, tenantId },
    });
    if (!pmp) throw new NotFoundException('Price override not found');
    await this.pmpRepo.softRemove(pmp);
  }

  // ─── Price Resolution (used by POS) ────────────────────────────────────────

  /**
   * Resolve the actual price for a modifier option on a specific product.
   * Checks ProductModifierPrice first, falls back to ModifierOption.priceAdjustment.
   */
  async resolvePrice(
    productId: number,
    modifierOptionId: number,
    tenantId: number,
  ): Promise<string> {
    const override = await this.pmpRepo.findOne({
      where: { productId, modifierOptionId, tenantId },
    });
    if (override) return override.priceAdjustment;

    const option = await this.optionRepo.findOne({
      where: { id: modifierOptionId, tenantId },
    });
    if (!option) throw new NotFoundException('Modifier option not found');
    return option.priceAdjustment;
  }
}
