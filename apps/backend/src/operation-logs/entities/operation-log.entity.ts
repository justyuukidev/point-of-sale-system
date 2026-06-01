import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OperationAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Audit log capturing all CRUD operations across domain entities.
 * Automatically populated by the OperationLogSubscriber.
 */
@Entity('operation_logs')
@Index(['tenantId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class OperationLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  tenantId!: number;

  /** User who performed the operation (null for system operations) */
  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  /** Entity class name, e.g. 'Product', 'Category', 'Order' */
  @Column({ length: 100 })
  entityType!: string;

  /** The entity's primary key ID */
  @Column()
  entityId!: number;

  /** The entity's UUID */
  @Column({ type: 'uuid', nullable: true })
  entityUuid!: string | null;

  /** CREATE | UPDATE | DELETE */
  @Column({ type: 'enum', enum: OperationAction })
  action!: OperationAction;

  /** JSON snapshot of changed fields (for UPDATE: { field: { old, new } }) */
  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, unknown> | null;

  /** Additional context (e.g., source: 'dashboard', 'mobile', 'sync') */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
