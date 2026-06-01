import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { LineItem } from './line-item.entity.js';
import { ModifierOption } from '../../inventory/entities/modifier-option.entity.js';

@Entity('line_item_modifiers')
export class LineItemModifier extends BaseEntity {
  @Column()
  lineItemId!: number;

  @ManyToOne(() => LineItem)
  @JoinColumn({ name: 'lineItemId' })
  lineItem?: LineItem;

  @Column()
  modifierOptionId!: number;

  @ManyToOne(() => ModifierOption)
  @JoinColumn({ name: 'modifierOptionId' })
  modifierOption?: ModifierOption;

  /** Denormalized name for receipt printing */
  @Column({ length: 255 })
  name!: string;

  /** Actual price charged (snapshot at time of sale) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAdjustment!: string;

  /** Quantity deducted from inventory (0 if not tracked) */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: '0.0000' })
  quantity!: string;
}
