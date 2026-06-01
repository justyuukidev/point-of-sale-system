import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
import { Product } from '../../inventory/entities/product.entity.js';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column()
  purchaseOrderId!: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder?: PurchaseOrder;

  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column()
  quantityOrdered!: number;

  @Column({ default: 0 })
  quantityReceived!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  unitCost!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
