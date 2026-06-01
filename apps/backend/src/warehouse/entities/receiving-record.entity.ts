import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { ReceivingRecordStatus } from '../../shared/enums/index.js';

@Entity('receiving_records')
export class ReceivingRecord extends BaseEntity {
  @Column()
  storeId!: number;

  @Column()
  dispatchId!: number;

  @Column({
    type: 'enum',
    enum: ReceivingRecordStatus,
    default: ReceivingRecordStatus.PENDING,
  })
  status!: ReceivingRecordStatus;

  @Column({ type: 'int', nullable: true })
  receivedById!: number | null;

  @Column({ type: 'int', nullable: true })
  locationId!: number | null;

  @Column({ type: 'date' })
  receivedDate!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', nullable: true })
  discrepancyNotes!: string | null;
}
