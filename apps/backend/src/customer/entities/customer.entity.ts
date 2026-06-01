import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CustomerDiscountType } from '../../shared/enums/index.js';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tin!: string | null;

  @Column({
    type: 'enum',
    enum: CustomerDiscountType,
    default: CustomerDiscountType.NONE,
  })
  discountType!: CustomerDiscountType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  idNumber!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ default: true })
  isActive!: boolean;
}
