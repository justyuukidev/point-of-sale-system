import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('tax_configs')
@Index(['tenantId', 'storeId'], { unique: true })
export class TaxConfig extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  storeId!: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  vatRate!: string;

  @Column({ length: 50 })
  birMinNumber!: string;

  @Column({ length: 50 })
  birPtuNumber!: string;

  @Column()
  nextOrNumber!: number;

  @Column()
  nextSiNumber!: number;
}
