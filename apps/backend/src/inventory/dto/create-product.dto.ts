import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  IsNumberString,
  MaxLength,
  Min,
} from 'class-validator';
import { VatType } from '../../shared/enums/index.js';

export class CreateProductDto {
  @IsInt()
  categoryId!: number;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(100)
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @IsNumberString()
  unitPrice!: string;

  @IsString()
  @MaxLength(30)
  unit!: string;

  @IsEnum(VatType)
  vatType!: VatType;

  @IsNumberString()
  vatRate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiryWarningDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
