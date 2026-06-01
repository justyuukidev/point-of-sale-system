import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ZReading } from './entities/z-reading.entity.js';
import { Receipt } from './entities/receipt.entity.js';
import { Transaction } from '../pos/entities/transaction.entity.js';
import { LineItem } from '../pos/entities/line-item.entity.js';
import { Payment } from '../pos/entities/payment.entity.js';
import { CashRegisterSession } from '../cash-management/entities/cash-register-session.entity.js';
import { CashDrawerEvent } from '../cash-management/entities/cash-drawer-event.entity.js';
import { GenerateZReadingDto } from './dto/index.js';
import {
  ZReadingReportType,
  TransactionStatus,
  CashDrawerEventType,
  PaymentMethod,
} from '../shared/enums/index.js';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class ZReadingService {
  constructor(
    @InjectRepository(ZReading)
    private readonly zReadingRepo: Repository<ZReading>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LineItem)
    private readonly lineItemRepo: Repository<LineItem>,
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepo: Repository<CashRegisterSession>,
    @InjectRepository(CashDrawerEvent)
    private readonly drawerEventRepo: Repository<CashDrawerEvent>,
  ) {}

  async generate(
    dto: GenerateZReadingDto,
    tenantId: number,
    userId: number,
  ): Promise<ZReading> {
    // Verify session exists
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, tenantId },
    });
    if (!session)
      throw new NotFoundException('Cash register session not found');

    // Check for existing Z-reading (only one per session)
    if (dto.reportType === ZReadingReportType.Z_READING) {
      const existing = await this.zReadingRepo.findOne({
        where: {
          sessionId: dto.sessionId,
          reportType: ZReadingReportType.Z_READING,
          tenantId,
        },
      });
      if (existing) {
        throw new ConflictException(
          'Z-Reading already generated for this session',
        );
      }
    }

    // Get all transactions for this session
    const transactions = await this.transactionRepo.find({
      where: { sessionId: dto.sessionId, tenantId },
    });

    const completedTxns = transactions.filter(
      (t) => t.status === TransactionStatus.COMPLETED,
    );
    const voidedTxns = transactions.filter(
      (t) => t.status === TransactionStatus.VOIDED,
    );
    const completedTxnIds = completedTxns.map((t) => t.id);

    // Batch load all line items for completed transactions (fix N+1)
    let allLineItems: LineItem[] = [];
    if (completedTxnIds.length > 0) {
      allLineItems = await this.lineItemRepo.find({
        where: { transactionId: In(completedTxnIds), tenantId },
      });
    }

    // Aggregate sales data
    let grossSales = 0;
    let vatableSales = 0;
    let vatExemptSales = 0;
    let zeroRatedSales = 0;
    let totalVatAmount = 0;
    let totalDiscounts = 0;
    let totalScDiscount = 0;
    const totalPwdDiscount = 0;

    for (const txn of completedTxns) {
      grossSales += parseFloat(txn.subtotal);
      totalVatAmount += parseFloat(txn.vatAmount);
      totalDiscounts += parseFloat(txn.discountAmount);
      totalScDiscount += parseFloat(txn.scPwdDiscountAmount);
    }

    // VAT breakdown from line items
    for (const li of allLineItems) {
      const lineTotal = parseFloat(li.lineTotal);
      if (li.vatType === 'VATABLE') {
        vatableSales += lineTotal;
      } else if (li.vatType === 'VAT_EXEMPT') {
        vatExemptSales += lineTotal;
      } else {
        zeroRatedSales += lineTotal;
      }
    }

    const totalVoids = voidedTxns.reduce(
      (sum, t) => sum + parseFloat(t.totalAmount),
      0,
    );
    // BIR formula: Net Sales = Gross Sales - Discounts - Returns - Voids
    const netSales = grossSales - totalDiscounts - totalVoids;

    // Get receipts for this session's transactions (batch query, not full tenant scan)
    let sessionReceipts: Receipt[] = [];
    if (completedTxnIds.length > 0) {
      sessionReceipts = await this.receiptRepo.find({
        where: { transactionId: In(completedTxnIds), tenantId },
        order: { orNumber: 'ASC' },
      });
    }

    const orNumbers = sessionReceipts.map((r) => r.orNumber).sort();
    const siNumbers = sessionReceipts
      .map((r) => r.siNumber)
      .filter(Boolean)
      .sort();

    // Cash drawer events
    const drawerEvents = await this.drawerEventRepo.find({
      where: { sessionId: dto.sessionId, tenantId },
    });
    const totalCashIn = drawerEvents
      .filter((e) => e.type === CashDrawerEventType.CASH_IN)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalCashOut = drawerEvents
      .filter((e) => e.type === CashDrawerEventType.CASH_OUT)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Expected cash: only count CASH payments (not card/e-wallet)
    let totalCashSales = 0;
    if (completedTxnIds.length > 0) {
      const cashPayments = await this.paymentRepo.find({
        where: {
          transactionId: In(completedTxnIds),
          method: PaymentMethod.CASH,
        },
      });
      totalCashSales = cashPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0,
      );
    }

    const openingCash = parseFloat(session.openingCash);
    const expectedCash =
      openingCash + totalCashSales + totalCashIn - totalCashOut;
    const actualCash = session.actualCash
      ? parseFloat(session.actualCash)
      : expectedCash;
    const cashOverShort = actualCash - expectedCash;

    // Get next report number
    const lastReport = await this.zReadingRepo.findOne({
      where: { storeId: session.storeId, tenantId },
      order: { reportNumber: 'DESC' },
    });
    const reportNumber = (lastReport?.reportNumber ?? 0) + 1;

    const zReading = this.zReadingRepo.create({
      storeId: session.storeId,
      deviceId: session.deviceId,
      sessionId: dto.sessionId,
      generatedById: userId,
      reportType: dto.reportType,
      reportNumber,
      reportDate: new Date().toISOString().split('T')[0],
      beginningOrNumber: orNumbers[0] ?? '00000000',
      endingOrNumber: orNumbers[orNumbers.length - 1] ?? '00000000',
      beginningSiNumber: siNumbers[0] ?? null,
      endingSiNumber: siNumbers[siNumbers.length - 1] ?? null,
      grossSales: grossSales.toFixed(4),
      netSales: netSales.toFixed(4),
      vatableSales: vatableSales.toFixed(4),
      vatExemptSales: vatExemptSales.toFixed(4),
      zeroRatedSales: zeroRatedSales.toFixed(4),
      vatAmount: totalVatAmount.toFixed(4),
      totalDiscounts: totalDiscounts.toFixed(4),
      scDiscount: totalScDiscount.toFixed(4),
      pwdDiscount: totalPwdDiscount.toFixed(4),
      totalReturns: '0.0000',
      totalVoids: totalVoids.toFixed(4),
      transactionCount: completedTxns.length,
      voidCount: voidedTxns.length,
      returnCount: 0,
      openingCash: openingCash.toFixed(4),
      totalCashIn: totalCashIn.toFixed(4),
      totalCashOut: totalCashOut.toFixed(4),
      expectedCash: expectedCash.toFixed(4),
      actualCash: actualCash.toFixed(4),
      cashOverShort: cashOverShort.toFixed(4),
      resetCounter: reportNumber,
      generatedAt: new Date(),
      tenantId,
    });

    return this.zReadingRepo.save(zReading);
  }

  async findAllByTenant(
    tenantId: number,
    storeId?: number,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<ZReading>> {
    const where: Record<string, unknown> = { tenantId };
    if (storeId) where.storeId = storeId;
    return paginate(
      this.zReadingRepo,
      { where, order: { generatedAt: 'DESC' } },
      pagination?.page,
      pagination?.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<ZReading> {
    const reading = await this.zReadingRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!reading) throw new NotFoundException('Z-Reading not found');
    return reading;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const reading = await this.findOneByUuid(uuid, tenantId);
    await this.zReadingRepo.softRemove(reading);
  }
}
