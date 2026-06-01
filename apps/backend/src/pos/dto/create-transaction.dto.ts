import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsDecimal,
  MaxLength,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../shared/enums/index.js';

export class LineItemModifierDto {
  @ApiProperty({ description: 'Modifier option ID to apply to this line item' })
  @IsInt()
  modifierOptionId!: number;
}

export class CreateLineItemDto {
  @IsInt()
  productId!: number;

  @IsOptional()
  @IsInt()
  batchId?: number;

  @IsOptional()
  @IsInt()
  discountId?: number;

  @IsInt()
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Modifiers to apply to this line item',
    type: [LineItemModifierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemModifierDto)
  modifiers?: LineItemModifierDto[];
}

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    description:
      'Payment method: CASH, CREDIT_CARD, DEBIT_CARD, GCASH, MAYA, QRPH, BANK_TRANSFER, OTHER',
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsDecimal({ decimal_digits: '1,4' })
  amount!: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  amountTendered?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;
}

export class CreateTransactionDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  sessionId!: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsInt()
  discountId?: number;

  @IsOptional()
  @IsBoolean()
  isOffline?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems!: CreateLineItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments!: CreatePaymentDto[];
}
