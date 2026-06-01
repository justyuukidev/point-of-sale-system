import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

/**
 * Tracks which operator (user) is currently active on which device.
 * Only one active session per device at a time.
 */
@Entity('operator_sessions')
@Index(['deviceId', 'tenantId'])
export class OperatorSession extends BaseEntity {
  @Column()
  deviceId!: number;

  @Column()
  operatorId!: number;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ default: true })
  isActive!: boolean;
}
