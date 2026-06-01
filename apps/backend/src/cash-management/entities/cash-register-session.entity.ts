import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CashRegisterSessionStatus } from '../../shared/enums/index.js';
import { CashDrawerEvent } from './cash-drawer-event.entity.js';

@Entity('cash_register_sessions')
export class CashRegisterSession extends BaseEntity {
  @OneToMany(() => CashDrawerEvent, (e) => e.session)
  events?: CashDrawerEvent[];
  @Column()
  storeId!: number;

  @Column()
  deviceId!: number;

  @Column()
  openedById!: number;

  @Column({ type: 'int', nullable: true })
  closedById!: number | null;

  @Column({
    type: 'enum',
    enum: CashRegisterSessionStatus,
    default: CashRegisterSessionStatus.OPEN,
  })
  status!: CashRegisterSessionStatus;

  @Column({ type: 'timestamptz' })
  openedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  openingCash!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  expectedCash!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  actualCash!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  cashDifference!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalCashSales!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalCardSales!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalEWalletSales!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalVoidAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalReturnAmount!: string | null;

  @Column({ type: 'int', nullable: true })
  transactionCount!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
