import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsInt,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../shared/enums/index.js';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  firebaseUid?: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsInt()
  warehouseId?: number;
}
