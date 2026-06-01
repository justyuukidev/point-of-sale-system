import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { PaymentMethod, PaymentStatus } from '../../shared/enums/index.js';
import { Transaction } from './transaction.entity.js';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column()
  transactionId!: number;

  @ManyToOne(() => Transaction, (t) => t.payments)
  @JoinColumn({ name: 'transactionId' })
  transaction?: Transaction;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  amount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  amountTendered!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  changeGiven!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}
