import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { VatType } from '../../shared/enums/index.js';
import { Transaction } from './transaction.entity.js';
import { Product } from '../../inventory/entities/product.entity.js';

@Entity('line_items')
export class LineItem extends BaseEntity {
  @Column()
  transactionId!: number;

  @ManyToOne(() => Transaction, (t) => t.lineItems)
  @JoinColumn({ name: 'transactionId' })
  transaction?: Transaction;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'int', nullable: true })
  batchId!: number | null;

  @Column({ type: 'int', nullable: true })
  discountId!: number | null;

  @Column({ length: 200, default: '' })
  productName!: string;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  unitPrice!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: '0.0000' })
  discountAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  lineTotal!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  vatAmount!: string;

  @Column({ type: 'enum', enum: VatType })
  vatType!: VatType;
}
