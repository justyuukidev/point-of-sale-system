import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateStockLevelDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  productId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  criticalThreshold?: number;
}
