import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { StockMovementType } from '../../shared/enums/index.js';

@Entity('stock_movements')
@Index(['storeId', 'productId'])
@Index(['batchId'])
export class StockMovement extends BaseEntity {
  @Column()
  storeId!: number;

  @Column()
  productId!: number;

  @Column({ type: 'int', nullable: true })
  batchId!: number | null;

  @Column({ type: 'enum', enum: StockMovementType })
  movementType!: StockMovementType;

  @Column()
  quantityChange!: number;

  @Column()
  quantityBefore!: number;

  @Column()
  quantityAfter!: number;

  @Column({ type: 'int', nullable: true })
  transactionId!: number | null;

  @Column({ type: 'int', nullable: true })
  returnId!: number | null;

  @Column({ type: 'int', nullable: true })
  receivingRecordId!: number | null;

  @Column({ type: 'int', nullable: true })
  dispatchId!: number | null;

  @Column()
  performedById!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
