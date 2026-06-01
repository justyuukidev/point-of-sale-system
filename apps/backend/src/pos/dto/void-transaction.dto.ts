import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../../shared/enums/index.js';

export class VoidTransactionDto {
  @IsEnum(TransactionStatus)
  status!: TransactionStatus.VOIDED;
}
