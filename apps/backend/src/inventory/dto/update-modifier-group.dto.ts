import { PartialType } from '@nestjs/swagger';
import { CreateModifierGroupDto } from './create-modifier-group.dto.js';

export class UpdateModifierGroupDto extends PartialType(
  CreateModifierGroupDto,
) {}
