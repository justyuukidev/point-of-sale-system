import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  businessName!: string;

  @Column({ length: 20 })
  tin!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ length: 255 })
  contactEmail!: string;

  @Column({ length: 30 })
  contactPhone!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birMinNumber!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birPtuNumber!: string | null;
}
