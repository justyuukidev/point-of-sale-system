import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateDispatchDto } from './create-dispatch.dto.js';
import { DispatchStatus } from '../../shared/enums/index.js';

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {
  @IsOptional()
  @IsEnum(DispatchStatus)
  status?: DispatchStatus;
}
