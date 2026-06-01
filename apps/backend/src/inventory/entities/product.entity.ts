import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { VatType } from '../../shared/enums/index.js';
import { Category } from './category.entity.js';

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
export class Product extends BaseEntity {
  @Column()
  categoryId!: number;

  @ManyToOne(() => Category, (c) => c.products)
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100 })
  sku!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  unitPrice!: string;

  @Column({ length: 30 })
  unit!: string;

  @Column({ type: 'enum', enum: VatType })
  vatType!: VatType;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  vatRate!: string;

  @Column({ type: 'int', nullable: true })
  expiryWarningDays!: number | null;

  @Column({ type: 'int', nullable: true })
  reorderPoint!: number | null;

  @Column({ default: true })
  isActive!: boolean;
}
