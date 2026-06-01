import {
  IsEnum,
  IsDecimal,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CashDrawerEventType } from '../../shared/enums/index.js';

export class CreateCashDrawerEventDto {
  @IsUUID()
  sessionUuid!: string;

  @IsEnum(CashDrawerEventType)
  type!: CashDrawerEventType;

  @IsDecimal({ decimal_digits: '1,4' })
  amount!: string;

  @IsString()
  @MaxLength(255)
  reason!: string;
}
