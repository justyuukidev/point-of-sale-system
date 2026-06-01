import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ length: 30 })
  contactPhone!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birMinNumber!: string | null;

  @Column({ default: true })
  isActive!: boolean;
}
