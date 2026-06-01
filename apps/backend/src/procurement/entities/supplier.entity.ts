import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('suppliers')
@Index(['tenantId', 'name'], { unique: true })
export class Supplier extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ default: true })
  isActive!: boolean;
}
