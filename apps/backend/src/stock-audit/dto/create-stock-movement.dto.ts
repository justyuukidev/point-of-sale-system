import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '../../shared/enums/index.js';

export class CreateStockMovementDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  productId!: number;

  @IsOptional()
  @IsInt()
  batchId?: number;

  @IsEnum(StockMovementType)
  movementType!: StockMovementType;

  @IsInt()
  quantityChange!: number;

  @IsOptional()
  @IsInt()
  transactionId?: number;

  @IsOptional()
  @IsInt()
  returnId?: number;

  @IsOptional()
  @IsInt()
  receivingRecordId?: number;

  @IsOptional()
  @IsInt()
  dispatchId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
