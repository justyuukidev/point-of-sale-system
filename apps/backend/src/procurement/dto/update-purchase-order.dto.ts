import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto.js';

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}
