import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  @MaxLength(30)
  contactPhone!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
