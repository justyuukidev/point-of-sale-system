import {
  IsInt,
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReturnLineItemDto {
  @IsOptional()
  @IsInt()
  lineItemId?: number;

  @IsInt()
  productId!: number;

  @IsOptional()
  @IsInt()
  batchId?: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateReturnDto {
  @IsInt()
  originalTransactionId!: number;

  @IsInt()
  storeId!: number;

  @IsString()
  @MaxLength(255)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnLineItemDto)
  lineItems!: CreateReturnLineItemDto[];
}
