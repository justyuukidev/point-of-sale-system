import {
  IsInt,
  IsString,
  IsOptional,
  IsNumberString,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateBatchDto {
  @IsInt()
  productId!: number;

  @IsInt()
  warehouseId!: number;

  @IsInt()
  supplierId!: number;

  @IsOptional()
  @IsInt()
  purchaseOrderItemId?: number;

  @IsString()
  @MaxLength(100)
  batchNumber!: string;

  @IsInt()
  quantity!: number;

  @IsNumberString()
  costPrice!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsDateString()
  deliveryDate!: string;
}
