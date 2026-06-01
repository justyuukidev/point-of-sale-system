import {
  IsEnum,
  IsDecimal,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../shared/enums/index.js';

export class AddPaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsDecimal({ decimal_digits: '1,4' })
  amount!: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  amountTendered?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;
}
