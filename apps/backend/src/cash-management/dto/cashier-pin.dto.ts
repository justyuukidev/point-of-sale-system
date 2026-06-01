import { IsInt, IsString, Length, Matches } from 'class-validator';

export class SetCashierPinDto {
  @IsInt()
  cashierUserId!: number;

  @IsString()
  @Length(4, 6)
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}

export class VerifyCashierPinDto {
  @IsInt()
  storeId!: number;

  @IsString()
  @Length(4, 6)
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}
