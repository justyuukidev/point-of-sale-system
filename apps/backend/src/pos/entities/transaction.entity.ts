import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { TransactionStatus } from '../../shared/enums/index.js';
import { LineItem } from './line-item.entity.js';
import { Payment } from './payment.entity.js';

@Entity('transactions')
@Index(['tenantId', 'storeId', 'transactionNumber'], { unique: true })
export class Transaction extends BaseEntity {
  @OneToMany(() => LineItem, (li) => li.transaction)
  lineItems?: LineItem[];

  @OneToMany(() => Payment, (p) => p.transaction)
  payments?: Payment[];
  @Column()
  storeId!: number;

  @Column()
  cashierId!: number;

  @Column()
  deviceId!: number;

  @Column()
  sessionId!: number;

  @Column({ type: 'int', nullable: true })
  customerId!: number | null;

  @Column({ type: 'int', nullable: true })
  discountId!: number | null;

  @Column({ length: 50 })
  transactionNumber!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ default: false })
  isOffline!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  offlineSyncedAt!: Date | null;

  @Column({ default: false })
  syncDiscrepancy!: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  subtotal!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  vatAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  discountAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: '0.0000' })
  scPwdDiscountAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalAmount!: string;
}
