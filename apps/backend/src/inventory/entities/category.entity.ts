import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Product } from './product.entity.js';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @OneToMany(() => Product, (p) => p.category)
  products?: Product[];
}
