import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { LineItemModifier } from './entities/line-item-modifier.entity.js';
import { Payment } from './entities/payment.entity.js';
import {
  TransactionStatus,
  PaymentStatus,
  DiscountType,
  PromoAction,
} from '../shared/enums/index.js';
import { CreateTransactionDto } from './dto/index.js';
import { Product } from '../inventory/entities/product.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { ModifierOption } from '../inventory/entities/modifier-option.entity.js';
import { ProductModifierPrice } from '../inventory/entities/product-modifier-price.entity.js';
import { Discount } from '../discounts/entities/discount.entity.js';
import { PromoHistory } from '../discounts/entities/promo-history.entity.js';
import { NotificationService } from '../notifications/notification.service.js';
import {
  NotificationType,
  NotificationChannel,
} from '../shared/enums/index.js';
import { CashRegisterSession } from '../cash-management/entities/cash-register-session.entity.js';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txnRepo: Repository<Transaction>,
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateTransactionDto,
    tenantId: number,
    cashierId: number,
  ): Promise<Transaction & { lineItems: LineItem[]; payments: Payment[] }> {
    if (!dto.lineItems || dto.lineItems.length === 0) {
      throw new BadRequestException(
        'Transaction must have at least one line item',
      );
    }
    if (!dto.payments || dto.payments.length === 0) {
      throw new BadRequestException(
        'Transaction must have at least one payment',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Look up deviceId from session
      const session = await manager.findOne(CashRegisterSession, {
        where: { id: dto.sessionId, tenantId },
        select: ['deviceId'],
      });
      if (!session) {
        throw new BadRequestException('Cash register session not found');
      }
      const deviceId = session.deviceId;

      // Generate transaction number
      const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // Calculate line items
      let subtotal = 0;
      let totalVat = 0;
      let totalDiscount = 0;
      let scPwdDiscountTotal = 0;
      const lineItemEntities: LineItem[] = [];

      for (const item of dto.lineItems) {
        const product = await this.productRepo.findOne({
          where: { id: item.productId, tenantId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with id ${item.productId} not found`,
          );
        }

        const unitPrice = parseFloat(product.unitPrice);
        const vatRate = parseFloat(product.vatRate);
        const lineTotal = unitPrice * item.quantity;
        const vatAmount = lineTotal * (vatRate / 100);
        const discountAmount = 0; // discount stacking handled later

        subtotal += lineTotal;
        totalVat += vatAmount;
        totalDiscount += discountAmount;

        const lineItem = manager.create(LineItem, {
          productId: item.productId,
          batchId: item.batchId ?? null,
          discountId: item.discountId ?? null,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(4),
          discountAmount: discountAmount.toFixed(4),
          lineTotal: lineTotal.toFixed(4),
          vatAmount: vatAmount.toFixed(4),
          vatType: product.vatType,
          tenantId,
        });
        lineItemEntities.push(lineItem);
      }

      // Apply transaction-level discount if provided
      let transactionDiscount: Discount | null = null;
      if (dto.discountId) {
        transactionDiscount = await manager.findOne(Discount, {
          where: { id: dto.discountId, tenantId },
        });
        if (!transactionDiscount) {
          throw new NotFoundException(
            `Discount with id ${dto.discountId} not found`,
          );
        }
        if (!transactionDiscount.isActive) {
          throw new BadRequestException('Discount is not active');
        }
        // Validate date range
        const today = new Date().toISOString().split('T')[0];
        if (
          transactionDiscount.validFrom &&
          transactionDiscount.validFrom > today
        ) {
          throw new BadRequestException('Discount is not yet valid');
        }
        if (
          transactionDiscount.validTo &&
          transactionDiscount.validTo < today
        ) {
          throw new BadRequestException('Discount has expired');
        }
        // Validate minimum purchase
        if (
          transactionDiscount.minPurchase &&
          subtotal < parseFloat(transactionDiscount.minPurchase)
        ) {
          throw new BadRequestException(
            `Minimum purchase of ${transactionDiscount.minPurchase} not met`,
          );
        }
        // Calculate discount amount
        const discountValue = parseFloat(transactionDiscount.value);
        if (
          transactionDiscount.type === DiscountType.SC ||
          transactionDiscount.type === DiscountType.PWD
        ) {
          // Philippine SC/PWD: discount is applied on the VAT-exclusive base price
          // and the VAT is removed from eligible (VATABLE) items
          let scPwdDiscount = 0;
          let vatRemoved = 0;
          for (const li of lineItemEntities) {
            if (li.vatType === 'VATABLE') {
              const lineTotal = parseFloat(li.lineTotal);
              const lineVat = parseFloat(li.vatAmount);
              // VAT-exclusive base = lineTotal (already VAT-exclusive since unitPrice is base)
              const discount = lineTotal * (discountValue / 100);
              scPwdDiscount += discount;
              vatRemoved += lineVat;
            }
          }
          totalDiscount += scPwdDiscount;
          totalVat -= vatRemoved; // Remove VAT from SC/PWD eligible items
          scPwdDiscountTotal = scPwdDiscount;
        } else if (transactionDiscount.type === DiscountType.PERCENTAGE) {
          totalDiscount += subtotal * (discountValue / 100);
        } else if (
          transactionDiscount.type === DiscountType.FIXED_AMOUNT ||
          transactionDiscount.type === DiscountType.VOUCHER
        ) {
          totalDiscount += discountValue;
        }
      }

      const finalTotal = subtotal + totalVat - totalDiscount;

      // Validate payments cover total (skip for offline-synced transactions)
      const totalPaid = dto.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0,
      );
      if (!dto.isOffline && totalPaid < finalTotal - 0.01) {
        throw new BadRequestException(
          `Insufficient payment: total=${finalTotal.toFixed(4)}, paid=${totalPaid.toFixed(4)}`,
        );
      }

      // Create transaction
      const txn = manager.create(Transaction, {
        storeId: dto.storeId,
        cashierId,
        deviceId,
        sessionId: dto.sessionId,
        customerId: dto.customerId ?? null,
        discountId: dto.discountId ?? null,
        transactionNumber,
        status: TransactionStatus.COMPLETED,
        isOffline: dto.isOffline ?? false,
        subtotal: subtotal.toFixed(4),
        vatAmount: totalVat.toFixed(4),
        discountAmount: totalDiscount.toFixed(4),
        scPwdDiscountAmount: scPwdDiscountTotal.toFixed(4),
        totalAmount: finalTotal.toFixed(4),
        tenantId,
      });
      const savedTxn = await manager.save(Transaction, txn);

      // Assign transactionId and save line items
      for (const li of lineItemEntities) {
        li.transactionId = savedTxn.id;
      }
      const savedLineItems = await manager.save(LineItem, lineItemEntities);

      // Process modifiers for each line item
      let totalModifierAdjustment = 0;
      for (let i = 0; i < dto.lineItems.length; i++) {
        const itemDto = dto.lineItems[i];
        const savedLi = savedLineItems[i];

        if (itemDto.modifiers && itemDto.modifiers.length > 0) {
          for (const mod of itemDto.modifiers) {
            const option = await manager.findOne(ModifierOption, {
              where: { id: mod.modifierOptionId, tenantId },
            });
            if (!option) {
              throw new NotFoundException(
                `Modifier option ${mod.modifierOptionId} not found`,
              );
            }
            if (!option.isAvailable) {
              throw new BadRequestException(
                `Modifier "${option.name}" is currently unavailable`,
              );
            }

            // Resolve price: check per-product override first
            let price = option.priceAdjustment;
            const override = await manager.findOne(ProductModifierPrice, {
              where: {
                productId: itemDto.productId,
                modifierOptionId: mod.modifierOptionId,
                tenantId,
              },
            });
            if (override) price = override.priceAdjustment;

            const priceNum = parseFloat(price);
            totalModifierAdjustment += priceNum * itemDto.quantity;

            // Create line item modifier record
            await manager.save(
              LineItemModifier,
              manager.create(LineItemModifier, {
                lineItemId: savedLi.id,
                modifierOptionId: mod.modifierOptionId,
                name: option.name,
                priceAdjustment: price,
                quantity: option.trackInventory
                  ? option.deductQuantity
                  : '0.0000',
                tenantId,
              }),
            );

            // Deduct modifier inventory if tracked
            if (option.trackInventory && option.productId) {
              const deductQty =
                parseFloat(option.deductQuantity) * itemDto.quantity;
              await manager.query(
                `UPDATE stock_levels
                 SET "currentQuantity" = "currentQuantity" - $1
                 WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4
                   AND "deletedAt" IS NULL AND "currentQuantity" - $1 >= 0`,
                [deductQty, dto.storeId, option.productId, tenantId],
              );
            }
          }
        }
      }

      // Adjust totals if modifiers added cost
      if (totalModifierAdjustment !== 0) {
        subtotal += totalModifierAdjustment;
        // Recalculate final total
        const newFinalTotal = subtotal + totalVat - totalDiscount;
        savedTxn.subtotal = subtotal.toFixed(4);
        savedTxn.totalAmount = newFinalTotal.toFixed(4);
        await manager.save(Transaction, savedTxn);
      }

      // Create payments
      const paymentEntities: Payment[] = [];
      for (const p of dto.payments) {
        const changeGiven =
          p.amountTendered && p.method === 'CASH'
            ? (parseFloat(p.amountTendered) - parseFloat(p.amount)).toFixed(4)
            : null;

        const payment = manager.create(Payment, {
          transactionId: savedTxn.id,
          method: p.method,
          status: PaymentStatus.COMPLETED,
          amount: p.amount,
          amountTendered: p.amountTendered ?? null,
          changeGiven,
          referenceNumber: p.referenceNumber ?? null,
          tenantId,
        });
        paymentEntities.push(payment);
      }
      const savedPayments = await manager.save(Payment, paymentEntities);

      // Deduct inventory stock levels atomically with row locking
      for (const item of dto.lineItems) {
        const result = await manager.query(
          `UPDATE stock_levels
           SET "currentQuantity" = "currentQuantity" - $1
           WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4
             AND "deletedAt" IS NULL AND "currentQuantity" - $1 >= 0
           RETURNING "currentQuantity"`,
          [item.quantity, dto.storeId, item.productId, tenantId],
        );

        if (result.length > 0) {
          // Check low stock threshold
          const product = await manager.findOne(Product, {
            where: { id: item.productId, tenantId },
          });
          const newQty = result[0].currentQuantity;
          if (product?.reorderPoint && newQty <= product.reorderPoint) {
            await this.notificationService.create(
              {
                storeId: dto.storeId,
                type: NotificationType.LOW_STOCK,
                channel: NotificationChannel.IN_APP,
                title: 'Low Stock Alert',
                message: `${product.name} is running low (${newQty} remaining, reorder point: ${product.reorderPoint})`,
              },
              tenantId,
            );
          }
        }
        // If no rows affected, stock level doesn't exist or insufficient — continue silently
        // (product may not be inventory-tracked)
      }

      // Log promo history if discount was applied
      if (transactionDiscount) {
        await manager.save(
          PromoHistory,
          manager.create(PromoHistory, {
            discountId: transactionDiscount.id,
            action: PromoAction.APPLIED,
            transactionId: savedTxn.id,
            tenantId,
          }),
        );
      }

      return {
        ...savedTxn,
        lineItems: savedLineItems,
        payments: savedPayments,
      };
    });
  }

  async findAllByTenant(
    tenantId: number,
    storeId?: number,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (storeId) where.storeId = storeId;
    const skip = (page - 1) * limit;
    const [data, total] = await this.txnRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Transaction> {
    const txn = await this.txnRepo.findOne({ where: { uuid, tenantId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }

  async findOneWithDetails(
    uuid: string,
    tenantId: number,
  ): Promise<Transaction & { lineItems: LineItem[]; payments: Payment[] }> {
    const txn = await this.findOneByUuid(uuid, tenantId);
    const lineItems = await this.lineItemRepo.find({
      where: { transactionId: txn.id, tenantId },
    });
    const payments = await this.paymentRepo.find({
      where: { transactionId: txn.id, tenantId },
    });
    return { ...txn, lineItems, payments };
  }

  async void(uuid: string, tenantId: number): Promise<Transaction> {
    const txn = await this.findOneByUuid(uuid, tenantId);
    if (txn.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed transactions can be voided',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Restore stock levels atomically
      const lineItems = await manager.find(LineItem, {
        where: { transactionId: txn.id, tenantId },
      });
      for (const li of lineItems) {
        await manager.query(
          `UPDATE stock_levels
           SET "currentQuantity" = "currentQuantity" + $1
           WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL`,
          [li.quantity, txn.storeId, li.productId, tenantId],
        );

        // Restore modifier inventory
        const modifiers = await manager.find(LineItemModifier, {
          where: { lineItemId: li.id, tenantId },
        });
        for (const mod of modifiers) {
          const option = await manager.findOne(ModifierOption, {
            where: { id: mod.modifierOptionId, tenantId },
          });
          if (option?.trackInventory && option.productId) {
            const restoreQty = parseFloat(mod.quantity) * li.quantity;
            await manager.query(
              `UPDATE stock_levels
               SET "currentQuantity" = "currentQuantity" + $1
               WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL`,
              [restoreQty, txn.storeId, option.productId, tenantId],
            );
          }
        }
      }

      txn.status = TransactionStatus.VOIDED;
      return manager.save(Transaction, txn);
    });
  }

  async getLineItems(
    transactionUuid: string,
    tenantId: number,
  ): Promise<LineItem[]> {
    const txn = await this.findOneByUuid(transactionUuid, tenantId);
    return this.lineItemRepo.find({
      where: { transactionId: txn.id, tenantId },
    });
  }

  async getPayments(
    transactionUuid: string,
    tenantId: number,
  ): Promise<Payment[]> {
    const txn = await this.findOneByUuid(transactionUuid, tenantId);
    return this.paymentRepo.find({
      where: { transactionId: txn.id, tenantId },
    });
  }
}
