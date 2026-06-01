import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReturnStatus } from '../../shared/enums/index.js';

export class UpdateReturnDto {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
