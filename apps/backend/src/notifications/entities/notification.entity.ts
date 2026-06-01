import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import {
  NotificationType,
  NotificationChannel,
} from '../../shared/enums/index.js';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @Column({ type: 'int', nullable: true })
  storeId!: number | null;

  @Column({ type: 'int', nullable: true })
  warehouseId!: number | null;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: false })
  isRead!: boolean;
}
