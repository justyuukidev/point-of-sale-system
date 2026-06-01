import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(255)
  businessName!: string;

  @IsString()
  @MaxLength(20)
  tin!: string;

  @IsString()
  address!: string;

  @IsEmail()
  @MaxLength(255)
  contactEmail!: string;

  @IsString()
  @MaxLength(30)
  contactPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  birMinNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  birPtuNumber?: string;
}
