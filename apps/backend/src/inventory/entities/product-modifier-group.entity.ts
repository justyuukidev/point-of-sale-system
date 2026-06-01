import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Product } from './product.entity.js';
import { ModifierGroup } from './modifier-group.entity.js';

@Entity('product_modifier_groups')
@Index(['tenantId', 'productId', 'modifierGroupId'], { unique: true })
export class ProductModifierGroup extends BaseEntity {
  @Column()
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column()
  modifierGroupId!: number;

  @ManyToOne(() => ModifierGroup)
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup?: ModifierGroup;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
