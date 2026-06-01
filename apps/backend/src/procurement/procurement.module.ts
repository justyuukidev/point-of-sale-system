import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { SupplierService } from './supplier.service.js';
import { PurchaseOrderService } from './purchase-order.service.js';
import { PurchaseOrderItemService } from './purchase-order-item.service.js';
import { SupplierController } from './supplier.controller.js';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { PurchaseOrderItemController } from './purchase-order-item.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, PurchaseOrder, PurchaseOrderItem]),
  ],
  controllers: [
    SupplierController,
    PurchaseOrderController,
    PurchaseOrderItemController,
  ],
  providers: [SupplierService, PurchaseOrderService, PurchaseOrderItemService],
  exports: [
    TypeOrmModule,
    SupplierService,
    PurchaseOrderService,
    PurchaseOrderItemService,
  ],
})
export class ProcurementModule {}
