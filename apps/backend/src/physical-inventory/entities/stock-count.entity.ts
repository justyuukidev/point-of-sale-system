import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { StockCountStatus } from '../../shared/enums/index.js';
import { StockCountItem } from './stock-count-item.entity.js';

@Entity('stock_counts')
export class StockCount extends BaseEntity {
  @OneToMany(() => StockCountItem, (sci) => sci.stockCount)
  items?: StockCountItem[];
  @Column()
  storeId!: number;

  @Column()
  initiatedById!: number;

  @Column({ type: 'int', nullable: true })
  approvedById!: number | null;

  @Column({
    type: 'enum',
    enum: StockCountStatus,
    default: StockCountStatus.IN_PROGRESS,
  })
  status!: StockCountStatus;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column()
  totalProducts!: number;

  @Column({ default: 0 })
  discrepancyCount!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
