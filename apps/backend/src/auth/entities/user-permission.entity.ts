import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Permission } from '../../shared/enums/index.js';

@Entity('user_permissions')
@Index(['tenantId', 'userId', 'permission'], { unique: true })
export class UserPermission extends BaseEntity {
  @Column()
  userId!: number;

  @Column({ type: 'enum', enum: Permission })
  permission!: Permission;
}
