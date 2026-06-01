import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateDispatchDto {
  @IsInt()
  warehouseId!: number;

  @IsInt()
  storeId!: number;

  @IsDateString()
  dispatchDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
