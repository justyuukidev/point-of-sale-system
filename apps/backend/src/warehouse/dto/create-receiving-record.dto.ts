import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateReceivingRecordDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  dispatchId!: number;

  @IsDateString()
  receivedDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
