import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  @MaxLength(30)
  contactPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  birMinNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
