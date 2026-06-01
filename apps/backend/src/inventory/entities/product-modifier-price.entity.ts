import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Product } from './product.entity.js';
import { ModifierOption } from './modifier-option.entity.js';

@Entity('product_modifier_prices')
@Index(['tenantId', 'productId', 'modifierOptionId'], { unique: true })
export class ProductModifierPrice extends BaseEntity {
  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column()
  modifierOptionId!: number;

  @ManyToOne(() => ModifierOption)
  @JoinColumn({ name: 'modifierOptionId' })
  modifierOption?: ModifierOption;

  /** Overrides the modifier option's default priceAdjustment for this specific product */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAdjustment!: string;
}
