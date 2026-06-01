import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { StockCount } from './stock-count.entity.js';
import { Product } from '../../inventory/entities/product.entity.js';

@Entity('stock_count_items')
@Index(['stockCountId', 'productId'], { unique: true })
export class StockCountItem extends BaseEntity {
  @Column()
  stockCountId!: number;

  @ManyToOne(() => StockCount, (sc) => sc.items)
  @JoinColumn({ name: 'stockCountId' })
  stockCount?: StockCount;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column()
  systemQuantity!: number;

  @Column({ type: 'int', nullable: true })
  countedQuantity!: number | null;

  @Column({ type: 'int', nullable: true })
  discrepancy!: number | null;

  @Column({ type: 'int', nullable: true })
  adjustmentMovementId!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
