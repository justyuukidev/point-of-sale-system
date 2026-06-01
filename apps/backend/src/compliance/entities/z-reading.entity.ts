import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ZReadingReportType } from '../../shared/enums/index.js';

@Entity('z_readings')
@Index(['sessionId', 'reportType'], { unique: true })
export class ZReading extends BaseEntity {
  @Column()
  storeId!: number;

  @Column()
  deviceId!: number;

  @Column()
  sessionId!: number;

  @Column()
  generatedById!: number;

  @Column({ type: 'enum', enum: ZReadingReportType })
  reportType!: ZReadingReportType;

  @Column()
  reportNumber!: number;

  @Column({ type: 'date' })
  reportDate!: string;

  @Column({ length: 20 })
  beginningOrNumber!: string;

  @Column({ length: 20 })
  endingOrNumber!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  beginningSiNumber!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  endingSiNumber!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  grossSales!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  netSales!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  vatableSales!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  vatExemptSales!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  zeroRatedSales!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  vatAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalDiscounts!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  scDiscount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  pwdDiscount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalReturns!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalVoids!: string;

  @Column()
  transactionCount!: number;

  @Column()
  voidCount!: number;

  @Column()
  returnCount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  openingCash!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalCashIn!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  totalCashOut!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  expectedCash!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  actualCash!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  cashOverShort!: string;

  @Column()
  resetCounter!: number;

  @Column({ type: 'timestamptz' })
  generatedAt!: Date;
}
