import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Dispatch } from './dispatch.entity.js';

@Entity('dispatch_items')
export class DispatchItem extends BaseEntity {
  @Column()
  dispatchId!: number;

  @ManyToOne(() => Dispatch, (d) => d.items)
  @JoinColumn({ name: 'dispatchId' })
  dispatch?: Dispatch;

  @Column()
  batchId!: number;

  @Column()
  productId!: number;

  @Column()
  quantity!: number;

  @Column({ type: 'int', nullable: true })
  quantityReceived!: number | null;
}
