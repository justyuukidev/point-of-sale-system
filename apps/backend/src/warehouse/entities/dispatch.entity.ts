import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { DispatchStatus } from '../../shared/enums/index.js';
import { DispatchItem } from './dispatch-item.entity.js';

@Entity('dispatches')
export class Dispatch extends BaseEntity {
  @OneToMany(() => DispatchItem, (di) => di.dispatch)
  items?: DispatchItem[];
  @Column()
  warehouseId!: number;

  @Column()
  storeId!: number;

  @Column({
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.PENDING,
  })
  status!: DispatchStatus;

  @Column({ type: 'int', nullable: true })
  dispatchedById!: number | null;

  @Column({ type: 'date' })
  dispatchDate!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
