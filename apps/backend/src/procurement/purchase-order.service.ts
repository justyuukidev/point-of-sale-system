import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/index.js';
import { PurchaseOrderStatus } from '../shared/enums/index.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

/** Valid state transitions for purchase orders */
const VALID_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [
    PurchaseOrderStatus.SUBMITTED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.SUBMITTED]: [
    PurchaseOrderStatus.APPROVED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.APPROVED]: [
    PurchaseOrderStatus.PARTIALLY_RECEIVED,
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: [PurchaseOrderStatus.RECEIVED],
  [PurchaseOrderStatus.RECEIVED]: [],
  [PurchaseOrderStatus.CANCELLED]: [],
};

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepo: Repository<PurchaseOrderItem>,
  ) {}

  async create(
    dto: CreatePurchaseOrderDto,
    tenantId: number,
    orderedById: number,
  ): Promise<PurchaseOrder> {
    const existing = await this.poRepo.findOne({
      where: { tenantId, poNumber: dto.poNumber },
    });
    if (existing)
      throw new ConflictException('PO number already exists for this tenant');

    const po = this.poRepo.create({ ...dto, tenantId, orderedById });
    return this.poRepo.save(po);
  }

  async findAllByTenant(tenantId: number, pagination: PaginationQueryDto) {
    return paginate(
      this.poRepo,
      {
        where: { tenantId },
        order: { orderDate: 'DESC', id: 'DESC' },
      },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({ where: { uuid, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async update(
    uuid: string,
    dto: UpdatePurchaseOrderDto,
    tenantId: number,
  ): Promise<PurchaseOrder> {
    const po = await this.findOneByUuid(uuid, tenantId);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== po.status) {
      const allowed = VALID_TRANSITIONS[po.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${po.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }
    }

    Object.assign(po, dto);
    return this.poRepo.save(po);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const po = await this.findOneByUuid(uuid, tenantId);
    await this.poRepo.softRemove(po);
  }

  /**
   * Recalculate totalAmount from PO items.
   */
  async recalculateTotal(
    purchaseOrderId: number,
    tenantId: number,
  ): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({
      where: { id: purchaseOrderId, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const items = await this.poItemRepo.find({
      where: { purchaseOrderId, tenantId },
    });
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.unitCost) * item.quantityOrdered,
      0,
    );
    po.totalAmount = total.toFixed(4);
    return this.poRepo.save(po);
  }
}
