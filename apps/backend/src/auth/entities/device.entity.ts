import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { DevicePlatform } from '../../shared/enums/index.js';

@Entity('devices')
export class Device extends BaseEntity {
  @Column()
  userId!: number;

  @Column({ length: 255, unique: true })
  deviceFingerprint!: string;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform!: DevicePlatform;

  @Column({ length: 100 })
  deviceName!: string;

  @Column({ default: true })
  isActive!: boolean;
}
