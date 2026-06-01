import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumberString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { PurchaseOrderStatus } from '../../shared/enums/index.js';

export class CreatePurchaseOrderDto {
  @IsInt()
  supplierId!: number;

  @IsInt()
  warehouseId!: number;

  @IsString()
  @MaxLength(50)
  poNumber!: string;

  @IsDateString()
  orderDate!: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsNumberString()
  totalAmount?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
