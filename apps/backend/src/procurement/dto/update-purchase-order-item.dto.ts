import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto.js';

export class UpdatePurchaseOrderItemDto extends PartialType(
  CreatePurchaseOrderItemDto,
) {}
