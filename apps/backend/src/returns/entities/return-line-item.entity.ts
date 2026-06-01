import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Return } from './return.entity.js';
import { Product } from '../../inventory/entities/product.entity.js';

@Entity('return_line_items')
export class ReturnLineItem extends BaseEntity {
  @Column()
  returnId!: number;

  @ManyToOne(() => Return, (r) => r.lineItems)
  @JoinColumn({ name: 'returnId' })
  return?: Return;

  @Column({ type: 'int', nullable: true })
  lineItemId!: number | null;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'int', nullable: true })
  batchId!: number | null;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  refundAmount!: string;
}
