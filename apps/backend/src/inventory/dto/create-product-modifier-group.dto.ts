import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductModifierGroupDto {
  @ApiProperty({ description: 'Product ID to assign the modifier group to' })
  @IsInt()
  productId!: number;

  @ApiProperty({ description: 'Modifier group ID to assign' })
  @IsInt()
  modifierGroupId!: number;

  @ApiPropertyOptional({
    description: 'Display sort order for this assignment',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
