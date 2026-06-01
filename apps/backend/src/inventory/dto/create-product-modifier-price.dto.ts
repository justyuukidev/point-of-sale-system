import { IsInt, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductModifierPriceDto {
  @ApiProperty({ description: 'Product ID for the price override' })
  @IsInt()
  productId!: number;

  @ApiProperty({ description: 'Modifier option ID for the price override' })
  @IsInt()
  modifierOptionId!: number;

  @ApiProperty({
    description: 'Per-product price adjustment (decimal string)',
    example: '25.00',
  })
  @IsNumberString()
  priceAdjustment!: string;
}
