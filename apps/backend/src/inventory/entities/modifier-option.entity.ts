import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ModifierGroup } from './modifier-group.entity.js';
import { Product } from './product.entity.js';

@Entity('modifier_options')
export class ModifierOption extends BaseEntity {
  @Column()
  modifierGroupId!: number;

  @ManyToOne(() => ModifierGroup, (g) => g.options)
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup?: ModifierGroup;

  @Column({ length: 255 })
  name!: string;

  /** If set, this modifier deducts inventory from the linked product */
  @Column({ type: 'int', nullable: true })
  productId!: number | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  /** Default price adjustment (can be overridden per-product via ProductModifierPrice) */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment!: string;

  /** How many units to deduct from linked product inventory (e.g., 0.2 for 200ml) */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  deductQuantity!: string;

  /** Whether to deduct stock when this modifier is used */
  @Column({ default: false })
  trackInventory!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ default: true })
  isAvailable!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
