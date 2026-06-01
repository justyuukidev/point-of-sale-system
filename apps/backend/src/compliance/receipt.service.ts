import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './entities/receipt.entity.js';
import { TaxConfigService } from './tax-config.service.js';
import { CreateReceiptDto } from './dto/index.js';
import { ReceiptType } from '../shared/enums/index.js';
import { Transaction } from '../pos/entities/transaction.entity.js';
import { LineItem } from '../pos/entities/line-item.entity.js';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
    private readonly taxConfigService: TaxConfigService,
  ) {}

  async create(
    dto: CreateReceiptDto,
    tenantId: number,
    cashierName: string,
  ): Promise<Receipt> {
    // Check transaction exists
    const txn = await this.transactionRepo.findOne({
      where: { id: dto.transactionId, tenantId },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    // Check no receipt already exists for this transaction
    const existing = await this.receiptRepo.findOne({
      where: { transactionId: dto.transactionId, tenantId },
    });
    if (existing) {
      throw new ConflictException(
        'Receipt already exists for this transaction',
      );
    }

    // Get line items to calculate VAT breakdown
    const lineItems = await this.lineItemRepo.find({
      where: { transactionId: txn.id, tenantId },
    });

    let totalVatable = 0;
    let totalVatExempt = 0;
    let totalZeroRated = 0;
    let totalVat = 0;

    for (const li of lineItems) {
      const lineTotal = parseFloat(li.lineTotal);
      const vatAmount = parseFloat(li.vatAmount);
      if (li.vatType === 'VATABLE') {
        totalVatable += lineTotal;
        totalVat += vatAmount;
      } else if (li.vatType === 'VAT_EXEMPT') {
        totalVatExempt += lineTotal;
      } else {
        totalZeroRated += lineTotal;
      }
    }

    // Generate OR/SI number
    const orNumber = await this.taxConfigService.getNextOrNumber(
      txn.storeId,
      tenantId,
    );
    let siNumber: string | null = null;
    if (dto.receiptType === ReceiptType.SALES_INVOICE) {
      siNumber = await this.taxConfigService.getNextSiNumber(
        txn.storeId,
        tenantId,
      );
    }

    const receipt = this.receiptRepo.create({
      transactionId: dto.transactionId,
      receiptType: dto.receiptType,
      orNumber,
      siNumber,
      cashierName,
      cashierSnapshot: { name: cashierName },
      customerName: dto.customerName ?? null,
      customerSnapshot: dto.customerName ? { name: dto.customerName } : null,
      totalVatable: totalVatable.toFixed(4),
      totalVatExempt: totalVatExempt.toFixed(4),
      totalZeroRated: totalZeroRated.toFixed(4),
      totalVat: totalVat.toFixed(4),
      totalDiscount: txn.discountAmount,
      scPwdDiscount: txn.scPwdDiscountAmount,
      printedAt: new Date(),
      tenantId,
    });

    return this.receiptRepo.save(receipt);
  }

  async findAllByTenant(
    tenantId: number,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<Receipt>> {
    return paginate(
      this.receiptRepo,
      { where: { tenantId }, order: { createdAt: 'DESC' } },
      pagination?.page,
      pagination?.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Receipt> {
    const receipt = await this.receiptRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async findByTransaction(
    transactionId: number,
    tenantId: number,
  ): Promise<Receipt | null> {
    return this.receiptRepo.findOne({ where: { transactionId, tenantId } });
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const receipt = await this.findOneByUuid(uuid, tenantId);
    await this.receiptRepo.softRemove(receipt);
  }
}
