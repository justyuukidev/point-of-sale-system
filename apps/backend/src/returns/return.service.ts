import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Return } from './entities/return.entity.js';
import { ReturnLineItem } from './entities/return-line-item.entity.js';
import { Transaction } from '../pos/entities/transaction.entity.js';
import { LineItem } from '../pos/entities/line-item.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { CreateReturnDto } from './dto/index.js';
import {
  ReturnStatus,
  TransactionStatus,
  NotificationType,
  NotificationChannel,
} from '../shared/enums/index.js';
import { NotificationService } from '../notifications/notification.service.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class ReturnService {
  constructor(
    @InjectRepository(Return)
    private readonly returnRepo: Repository<Return>,
    @InjectRepository(ReturnLineItem)
    private readonly returnLineItemRepo: Repository<ReturnLineItem>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateReturnDto,
    tenantId: number,
    cashierId: number,
  ): Promise<Return> {
    // Validate original transaction exists and is completed
    const txn = await this.transactionRepo.findOne({
      where: { id: dto.originalTransactionId, tenantId },
    });
    if (!txn) throw new NotFoundException('Original transaction not found');
    if (txn.status === TransactionStatus.VOIDED) {
      throw new BadRequestException(
        'Cannot return items from a voided transaction',
      );
    }

    // Get original line items for price lookup
    const originalLineItems = await this.lineItemRepo.find({
      where: { transactionId: txn.id, tenantId },
    });

    // Get previously returned quantities for this transaction
    const previousReturns = await this.returnRepo.find({
      where: { originalTransactionId: txn.id, tenantId },
    });
    const previousReturnIds = previousReturns
      .filter((r) => r.status !== ReturnStatus.REJECTED)
      .map((r) => r.id);

    let previousReturnItems: ReturnLineItem[] = [];
    if (previousReturnIds.length > 0) {
      previousReturnItems = await this.returnLineItemRepo.find({
        where: previousReturnIds.map((id) => ({ returnId: id, tenantId })),
      });
    }

    // Calculate refund amounts per return line item
    let totalRefund = 0;
    const returnLineItems: Partial<ReturnLineItem>[] = [];

    for (const item of dto.lineItems) {
      // Find matching original line item for price reference
      const origLi = originalLineItems.find(
        (li) => li.productId === item.productId,
      );
      if (!origLi) {
        throw new BadRequestException(
          `Product ${item.productId} not found in original transaction`,
        );
      }

      // Validate return quantity doesn't exceed what's returnable
      const alreadyReturned = previousReturnItems
        .filter((ri) => ri.productId === item.productId)
        .reduce((sum, ri) => sum + ri.quantity, 0);
      const maxReturnable = origLi.quantity - alreadyReturned;
      if (item.quantity > maxReturnable) {
        throw new BadRequestException(
          `Cannot return ${item.quantity} of product ${item.productId}. Max returnable: ${maxReturnable} (sold: ${origLi.quantity}, already returned: ${alreadyReturned})`,
        );
      }

      const unitPrice = parseFloat(origLi.unitPrice);
      const vatAmount = parseFloat(origLi.vatAmount) / origLi.quantity;
      const refundPerUnit = unitPrice + vatAmount;
      const refundAmount = refundPerUnit * item.quantity;
      totalRefund += refundAmount;

      returnLineItems.push({
        lineItemId: item.lineItemId ?? origLi.id,
        productId: item.productId,
        batchId: item.batchId ?? origLi.batchId,
        quantity: item.quantity,
        refundAmount: refundAmount.toFixed(4),
        tenantId,
      });
    }

    // Execute in transaction for atomicity
    return this.dataSource.transaction(async (manager) => {
      const returnEntity = manager.create(Return, {
        originalTransactionId: dto.originalTransactionId,
        storeId: dto.storeId,
        cashierId,
        reason: dto.reason,
        totalRefund: totalRefund.toFixed(4),
        status: ReturnStatus.PENDING,
        notes: dto.notes ?? null,
        tenantId,
      });
      const savedReturn = await manager.save(returnEntity);

      // Save line items
      for (const item of returnLineItems) {
        const rli = manager.create(ReturnLineItem, {
          ...item,
          returnId: savedReturn.id,
        });
        await manager.save(rli);
      }

      return savedReturn;
    });
  }

  async approve(uuid: string, tenantId: number): Promise<Return> {
    const ret = await this.findOneByUuid(uuid, tenantId);
    if (ret.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve return with status ${ret.status}`,
      );
    }

    const lineItems = await this.returnLineItemRepo.find({
      where: { returnId: ret.id, tenantId },
    });

    await this.dataSource.transaction(async (manager) => {
      // Restore stock atomically
      for (const li of lineItems) {
        await manager.query(
          `UPDATE stock_levels
           SET "currentQuantity" = "currentQuantity" + $1
           WHERE "productId" = $2 AND "storeId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL`,
          [li.quantity, li.productId, ret.storeId, tenantId],
        );
      }

      ret.status = ReturnStatus.APPROVED;
      await manager.save(Return, ret);
    });

    // Notify about approved return
    await this.notificationService.create(
      {
        storeId: ret.storeId,
        type: NotificationType.RETURN_APPROVED,
        channel: NotificationChannel.IN_APP,
        title: 'Return Approved',
        message: `Return #${ret.uuid.slice(0, 8)} has been approved. Stock restored.`,
      },
      tenantId,
    );

    return ret;
  }

  async reject(
    uuid: string,
    tenantId: number,
    notes?: string,
  ): Promise<Return> {
    const ret = await this.findOneByUuid(uuid, tenantId);
    if (ret.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject return with status ${ret.status}`,
      );
    }
    ret.status = ReturnStatus.REJECTED;
    if (notes) ret.notes = notes;
    return this.returnRepo.save(ret);
  }

  async complete(uuid: string, tenantId: number): Promise<Return> {
    const ret = await this.findOneByUuid(uuid, tenantId);
    if (ret.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException(
        'Return must be approved before completing',
      );
    }
    ret.status = ReturnStatus.COMPLETED;
    return this.returnRepo.save(ret);
  }

  async findAllByTenant(
    tenantId: number,
    pagination: PaginationQueryDto,
    storeId?: number,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (storeId) where.storeId = storeId;
    return paginate(
      this.returnRepo,
      { where, order: { createdAt: 'DESC' } },
      pagination.page,
      pagination.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Return> {
    const ret = await this.returnRepo.findOne({ where: { uuid, tenantId } });
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  async findLineItems(
    uuid: string,
    tenantId: number,
  ): Promise<ReturnLineItem[]> {
    const ret = await this.findOneByUuid(uuid, tenantId);
    return this.returnLineItemRepo.find({
      where: { returnId: ret.id, tenantId },
    });
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const ret = await this.findOneByUuid(uuid, tenantId);
    if (ret.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Can only delete pending returns');
    }
    await this.returnRepo.softRemove(ret);
  }
}
