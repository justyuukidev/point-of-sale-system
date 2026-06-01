import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateStockLevelDto } from './create-stock-level.dto.js';

export class UpdateStockLevelDto extends PartialType(
  OmitType(CreateStockLevelDto, ['storeId', 'productId'] as const),
) {}
