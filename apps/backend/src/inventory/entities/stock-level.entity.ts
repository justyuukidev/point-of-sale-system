import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Product } from './product.entity.js';
import { Store } from '../../warehouse/entities/store.entity.js';

@Entity('stock_levels')
@Index(['tenantId', 'storeId', 'productId'], { unique: true })
export class StockLevel extends BaseEntity {
  @Column()
  storeId!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store?: Store;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ default: 0 })
  currentQuantity!: number;

  @Column({ default: 0 })
  initialQuantity!: number;

  @Column({ type: 'int', nullable: true })
  locationId!: number | null;

  @Column({ default: 0 })
  reorderThreshold!: number;

  @Column({ default: 0 })
  criticalThreshold!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastRestockedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastCountedAt!: Date | null;
}
