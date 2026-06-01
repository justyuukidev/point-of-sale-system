import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductModifierPriceDto } from './create-product-modifier-price.dto.js';

export class UpdateProductModifierPriceDto extends PartialType(
  OmitType(CreateProductModifierPriceDto, ['productId', 'modifierOptionId']),
) {}
