import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  IsDecimal,
  MaxLength,
} from 'class-validator';

export class CreateCashRegisterSessionDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  deviceId!: number;

  @IsDateString()
  openedAt!: string;

  @IsDecimal({ decimal_digits: '1,4' })
  openingCash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
