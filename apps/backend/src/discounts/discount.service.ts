import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from './entities/discount.entity.js';
import { PromoHistory } from './entities/promo-history.entity.js';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/index.js';
import { PromoAction, DiscountType } from '../shared/enums/index.js';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepo: Repository<Discount>,
    @InjectRepository(PromoHistory)
    private readonly promoHistoryRepo: Repository<PromoHistory>,
  ) {}

  async create(dto: CreateDiscountDto, tenantId: number): Promise<Discount> {
    this.validateDiscountValue(dto.type, dto.value);
    const discount = this.discountRepo.create({ ...dto, tenantId });
    const saved = await this.discountRepo.save(discount);

    // Log promo history
    await this.promoHistoryRepo.save(
      this.promoHistoryRepo.create({
        discountId: saved.id,
        action: PromoAction.CREATED,
        newValue: { ...dto } as Record<string, unknown>,
        tenantId,
      }),
    );

    return saved;
  }

  async findAllByTenant(
    tenantId: number,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<Discount>> {
    return paginate(
      this.discountRepo,
      { where: { tenantId }, order: { name: 'ASC' } },
      pagination?.page,
      pagination?.limit,
    );
  }

  async findActive(tenantId: number): Promise<Discount[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.discountRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.isActive = :isActive', { isActive: true })
      .andWhere('d.deletedAt IS NULL')
      .andWhere('(d.validFrom IS NULL OR d.validFrom <= :today)', { today })
      .andWhere('(d.validTo IS NULL OR d.validTo >= :today)', { today })
      .orderBy('d.name', 'ASC')
      .getMany();
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Discount> {
    const discount = await this.discountRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async findHistory(
    uuid: string,
    tenantId: number,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<PromoHistory>> {
    const discount = await this.findOneByUuid(uuid, tenantId);
    return paginate(
      this.promoHistoryRepo,
      {
        where: { discountId: discount.id, tenantId },
        order: { createdAt: 'DESC' },
      },
      pagination?.page,
      pagination?.limit,
    );
  }

  async update(
    uuid: string,
    dto: UpdateDiscountDto,
    tenantId: number,
    userId?: number,
  ): Promise<Discount> {
    const discount = await this.findOneByUuid(uuid, tenantId);

    // Validate value if type or value is being changed
    const effectiveType = dto.type ?? discount.type;
    const effectiveValue = dto.value ?? discount.value;
    if (dto.type || dto.value) {
      this.validateDiscountValue(effectiveType, effectiveValue);
    }

    const previousValue = { ...discount } as Record<string, unknown>;

    Object.assign(discount, dto);
    const saved = await this.discountRepo.save(discount);

    // Determine action type
    let action = PromoAction.MODIFIED;
    if ('isActive' in dto) {
      action = dto.isActive ? PromoAction.ACTIVATED : PromoAction.DEACTIVATED;
    }

    // Log promo history
    await this.promoHistoryRepo.save(
      this.promoHistoryRepo.create({
        discountId: saved.id,
        action,
        performedBy: userId ?? null,
        previousValue,
        newValue: { ...dto } as Record<string, unknown>,
        tenantId,
      }),
    );

    return saved;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const discount = await this.findOneByUuid(uuid, tenantId);
    await this.discountRepo.softRemove(discount);
  }

  async logApplication(
    discountId: number,
    transactionId: number,
    tenantId: number,
  ): Promise<void> {
    await this.promoHistoryRepo.save(
      this.promoHistoryRepo.create({
        discountId,
        action: PromoAction.APPLIED,
        transactionId,
        tenantId,
      }),
    );
  }

  private validateDiscountValue(type: DiscountType, value: string): void {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      throw new BadRequestException(
        'Discount value must be a non-negative number',
      );
    }
    if (
      (type === DiscountType.PERCENTAGE ||
        type === DiscountType.SC ||
        type === DiscountType.PWD) &&
      numValue > 100
    ) {
      throw new BadRequestException(
        'Percentage discount value cannot exceed 100',
      );
    }
  }
}
