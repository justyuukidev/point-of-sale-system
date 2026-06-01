import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumberString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModifierOptionDto {
  @ApiProperty({ description: 'ID of the parent modifier group' })
  @IsInt()
  modifierGroupId!: number;

  @ApiProperty({
    description: 'Option name displayed to cashier',
    example: 'Large',
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Link to a product for inventory deduction',
  })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Price adjustment (decimal string)',
    example: '20.00',
  })
  @IsOptional()
  @IsNumberString()
  priceAdjustment?: string;

  @ApiPropertyOptional({
    description: 'Units to deduct from linked product',
    example: '1.0000',
    default: '1.0000',
  })
  @IsOptional()
  @IsNumberString()
  deductQuantity?: string;

  @ApiPropertyOptional({
    description: 'Whether to deduct inventory for the linked product',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this option is selected by default',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this option is currently available',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
