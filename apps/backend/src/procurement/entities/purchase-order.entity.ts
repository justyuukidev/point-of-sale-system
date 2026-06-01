import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { PurchaseOrderStatus } from '../../shared/enums/index.js';
import { PurchaseOrderItem } from './purchase-order-item.entity.js';

@Entity('purchase_orders')
@Index(['tenantId', 'poNumber'], { unique: true })
export class PurchaseOrder extends BaseEntity {
  @OneToMany(() => PurchaseOrderItem, (i) => i.purchaseOrder)
  items?: PurchaseOrderItem[];
  @Column()
  supplierId!: number;

  @Column()
  warehouseId!: number;

  @Column()
  orderedById!: number;

  @Column({ type: 'int', nullable: true })
  approvedById!: number | null;

  @Column({ length: 50 })
  poNumber!: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status!: PurchaseOrderStatus;

  @Column({ type: 'date' })
  orderDate!: string;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate!: string | null;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalAmount!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
