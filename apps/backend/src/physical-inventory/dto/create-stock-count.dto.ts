import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockCountDto {
  @ApiProperty({ description: 'Store ID to perform the count in' })
  @IsInt()
  storeId!: number;

  @ApiPropertyOptional({ description: 'Optional notes for this count session' })
  @IsOptional()
  @IsString()
  notes?: string;
}
