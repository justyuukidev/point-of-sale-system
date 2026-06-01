import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from './dto/index.js';

@Injectable()
export class PurchaseOrderItemService {
  constructor(
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
  ) {}

  async create(
    dto: CreatePurchaseOrderItemDto,
    tenantId: number,
  ): Promise<PurchaseOrderItem> {
    // Verify PO exists and belongs to tenant
    const po = await this.poRepo.findOne({
      where: { id: dto.purchaseOrderId, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const item = this.poItemRepo.create({ ...dto, tenantId });
    const saved = await this.poItemRepo.save(item);

    // Recalculate PO total
    await this.recalculateTotal(dto.purchaseOrderId, tenantId);

    return saved;
  }

  async findByPurchaseOrder(
    purchaseOrderId: number,
    tenantId: number,
  ): Promise<PurchaseOrderItem[]> {
    return this.poItemRepo.find({
      where: { purchaseOrderId, tenantId },
      order: { id: 'ASC' },
    });
  }

  async findOneByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<PurchaseOrderItem> {
    const item = await this.poItemRepo.findOne({ where: { uuid, tenantId } });
    if (!item) throw new NotFoundException('Purchase order item not found');
    return item;
  }

  async update(
    uuid: string,
    dto: UpdatePurchaseOrderItemDto,
    tenantId: number,
  ): Promise<PurchaseOrderItem> {
    const item = await this.findOneByUuid(uuid, tenantId);
    Object.assign(item, dto);
    const saved = await this.poItemRepo.save(item);

    // Recalculate PO total
    await this.recalculateTotal(item.purchaseOrderId, tenantId);

    return saved;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const item = await this.findOneByUuid(uuid, tenantId);
    const poId = item.purchaseOrderId;
    await this.poItemRepo.softRemove(item);

    // Recalculate PO total
    await this.recalculateTotal(poId, tenantId);
  }

  private async recalculateTotal(
    purchaseOrderId: number,
    tenantId: number,
  ): Promise<void> {
    const items = await this.poItemRepo.find({
      where: { purchaseOrderId, tenantId },
    });
    const total = items.reduce(
      (sum, i) => sum + parseFloat(i.unitCost) * i.quantityOrdered,
      0,
    );
    await this.poRepo.update(
      { id: purchaseOrderId, tenantId },
      { totalAmount: total.toFixed(4) },
    );
  }
}
