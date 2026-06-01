import { IsInt, IsOptional, IsNumberString, IsString } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsInt()
  purchaseOrderId!: number;

  @IsInt()
  productId!: number;

  @IsInt()
  quantityOrdered!: number;

  @IsNumberString()
  unitCost!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
