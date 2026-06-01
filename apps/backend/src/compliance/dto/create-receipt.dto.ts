import {
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ReceiptType } from '../../shared/enums/index.js';

export class CreateReceiptDto {
  @IsInt()
  transactionId!: number;

  @IsEnum(ReceiptType)
  receiptType!: ReceiptType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string;
}
