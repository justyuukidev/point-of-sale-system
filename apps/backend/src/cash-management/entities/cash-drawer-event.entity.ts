import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CashDrawerEventType } from '../../shared/enums/index.js';
import { CashRegisterSession } from './cash-register-session.entity.js';

@Entity('cash_drawer_events')
export class CashDrawerEvent extends BaseEntity {
  @Column()
  sessionId!: number;

  @ManyToOne(() => CashRegisterSession, (s) => s.events)
  @JoinColumn({ name: 'sessionId' })
  session?: CashRegisterSession;

  @Column({ type: 'enum', enum: CashDrawerEventType })
  type!: CashDrawerEventType;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  amount!: string;

  @Column({ length: 255 })
  reason!: string;

  @Column()
  performedById!: number;
}
