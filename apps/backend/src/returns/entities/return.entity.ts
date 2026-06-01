import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ReturnStatus } from '../../shared/enums/index.js';
import { ReturnLineItem } from './return-line-item.entity.js';

@Entity('returns')
export class Return extends BaseEntity {
  @OneToMany(() => ReturnLineItem, (rli) => rli.return)
  lineItems?: ReturnLineItem[];
  @Column()
  originalTransactionId!: number;

  @Column({ type: 'int', nullable: true })
  refundTransactionId!: number | null;

  @Column()
  storeId!: number;

  @Column()
  cashierId!: number;

  @Column({ length: 255 })
  reason!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalRefund!: string;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
  status!: ReturnStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
