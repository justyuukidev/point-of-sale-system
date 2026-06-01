import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { DiscountType } from '../../shared/enums/index.js';

@Entity('discounts')
export class Discount extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: DiscountType })
  type!: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  value!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  minPurchase!: string | null;

  @Column({ default: false })
  requiresCustomer!: boolean;

  @Column({ type: 'date', nullable: true })
  validFrom!: string | null;

  @Column({ type: 'date', nullable: true })
  validTo!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isStackable!: boolean;
}
