import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ length: 30 })
  contactPhone!: string;

  @Column({ default: true })
  isActive!: boolean;
}
