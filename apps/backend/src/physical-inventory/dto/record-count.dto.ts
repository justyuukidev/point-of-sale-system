import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordCountDto {
  @ApiProperty({ description: 'Physically counted quantity' })
  @IsInt()
  @Min(0)
  countedQuantity!: number;

  @ApiPropertyOptional({ description: 'Optional notes for this item' })
  @IsOptional()
  @IsString()
  notes?: string;
}
