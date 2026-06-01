import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Product } from '../../inventory/entities/product.entity.js';

@Entity('store_batch_records')
@Index(['tenantId', 'storeId', 'productId', 'batchId'])
export class StoreBatchRecord extends BaseEntity {
  @Column()
  storeId!: number;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column()
  batchId!: number;

  @Column()
  quantityReceived!: number;

  @Column({ default: 0 })
  quantityRemaining!: number;

  @Column({ type: 'int', nullable: true })
  receivingRecordId!: number | null;
}
