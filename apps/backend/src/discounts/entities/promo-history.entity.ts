import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { PromoAction } from '../../shared/enums/index.js';

@Entity('promo_history')
export class PromoHistory extends BaseEntity {
  @Column()
  discountId!: number;

  @Column({ type: 'enum', enum: PromoAction })
  action!: PromoAction;

  @Column({ type: 'int', nullable: true })
  performedBy!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  previousValue!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue!: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  transactionId!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;
}
