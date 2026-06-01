import { IsDecimal, IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseCashRegisterSessionDto {
  @IsDecimal({ decimal_digits: '1,4' })
  actualCash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
