import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { UserRole } from '../../shared/enums/index.js';

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true, nullable: true })
  firebaseUid!: string | null;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  username!: string | null;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'int', nullable: true })
  storeId!: number | null;

  @Column({ type: 'int', nullable: true })
  warehouseId!: number | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 60, nullable: true })
  pinHash!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;
}
