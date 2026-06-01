import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumberString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { DiscountType } from '../../shared/enums/index.js';

export class CreateDiscountDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsNumberString()
  value!: string;

  /**
   * Validated at service level: percentage values must be 0-100.
   * SC/PWD are always 20% per Philippine law (value ignored).
   */

  @IsOptional()
  @IsNumberString()
  minPurchase?: string;

  @IsOptional()
  @IsBoolean()
  requiresCustomer?: boolean;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;
}
