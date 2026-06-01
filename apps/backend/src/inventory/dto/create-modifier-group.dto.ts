import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModifierSelectionType } from '../../shared/enums/index.js';

export class CreateModifierGroupDto {
  @ApiProperty({ description: 'Name of the modifier group', example: 'Size' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    enum: ModifierSelectionType,
    enumName: 'ModifierSelectionType',
    description: 'SINGLE = radio, MULTIPLE = checkbox',
  })
  @IsEnum(ModifierSelectionType)
  selectionType!: ModifierSelectionType;

  @ApiPropertyOptional({
    description: 'Whether a selection is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum number of selections (for MULTIPLE)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of selections (for MULTIPLE)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
