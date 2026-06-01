import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ModifierSelectionType } from '../../shared/enums/index.js';
import { ModifierOption } from './modifier-option.entity.js';

@Entity('modifier_groups')
export class ModifierGroup extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ModifierSelectionType })
  selectionType!: ModifierSelectionType;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ type: 'int', default: 0 })
  minSelections!: number;

  @Column({ type: 'int', nullable: true })
  maxSelections!: number | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => ModifierOption, (o) => o.modifierGroup)
  options?: ModifierOption[];
}
