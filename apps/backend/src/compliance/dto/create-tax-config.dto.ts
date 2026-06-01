import {
  IsInt,
  IsOptional,
  IsNumberString,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaxConfigDto {
  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsNumberString()
  vatRate!: string;

  @IsString()
  @MaxLength(50)
  birMinNumber!: string;

  @IsString()
  @MaxLength(50)
  birPtuNumber!: string;

  @IsOptional()
  @IsInt()
  nextOrNumber?: number;

  @IsOptional()
  @IsInt()
  nextSiNumber?: number;
}
