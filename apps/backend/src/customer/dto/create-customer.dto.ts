import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { CustomerDiscountType } from '../../shared/enums/index.js';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tin?: string;

  @IsOptional()
  @IsEnum(CustomerDiscountType)
  discountType?: CustomerDiscountType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
