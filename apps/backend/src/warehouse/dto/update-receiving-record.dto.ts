import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateReceivingRecordDto } from './create-receiving-record.dto.js';
import { ReceivingRecordStatus } from '../../shared/enums/index.js';

export class UpdateReceivingRecordDto extends PartialType(
  CreateReceivingRecordDto,
) {
  @IsOptional()
  @IsEnum(ReceivingRecordStatus)
  status?: ReceivingRecordStatus;
}
