import { PartialType } from '@nestjs/swagger';
import { CreateModifierOptionDto } from './create-modifier-option.dto.js';

export class UpdateModifierOptionDto extends PartialType(
  CreateModifierOptionDto,
) {}
