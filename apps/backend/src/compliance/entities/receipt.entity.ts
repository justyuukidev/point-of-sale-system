import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ReceiptType } from '../../shared/enums/index.js';

@Entity('receipts')
@Index(['tenantId', 'orNumber'], { unique: true })
export class Receipt extends BaseEntity {
  @Column({ unique: true })
  transactionId!: number;

  @Column({ type: 'enum', enum: ReceiptType })
  receiptType!: ReceiptType;

  @Column({ length: 20 })
  orNumber!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  siNumber!: string | null;

  @Column({ length: 200 })
  cashierName!: string;

  @Column({ type: 'jsonb' })
  cashierSnapshot!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  customerSnapshot!: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalVatable!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalVatExempt!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalZeroRated!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalVat!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalDiscount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: '0.0000' })
  scPwdDiscount!: string;

  // BIR-required snapshots (frozen at receipt time for audit trail)
  @Column({ length: 200, default: '' })
  businessName!: string;

  @Column({ length: 50, default: '' })
  tin!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  minNumber!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ptuNumber!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storeAddress!: string | null;

  @Column({ type: 'timestamptz' })
  printedAt!: Date;

  @Column({ type: 'text', nullable: true })
  receiptData!: string | null;
}
