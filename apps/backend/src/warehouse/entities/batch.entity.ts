import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('batches')
export class Batch extends BaseEntity {
  @Column()
  productId!: number;

  @Column()
  warehouseId!: number;

  @Column()
  supplierId!: number;

  @Column({ type: 'int', nullable: true })
  purchaseOrderItemId!: number | null;

  @Column({ length: 100 })
  batchNumber!: string;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  costPrice!: string;

  @Column({ type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ type: 'date' })
  deliveryDate!: string;

  @Column({ default: 0 })
  remainingQuantity!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierInvoiceNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
