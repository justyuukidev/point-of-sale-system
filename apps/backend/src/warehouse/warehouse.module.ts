import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity.js';
import { Warehouse } from './entities/warehouse.entity.js';
import { Batch } from './entities/batch.entity.js';
import { Dispatch } from './entities/dispatch.entity.js';
import { DispatchItem } from './entities/dispatch-item.entity.js';
import { ReceivingRecord } from './entities/receiving-record.entity.js';
import { StoreInventoryLocation } from './entities/store-inventory-location.entity.js';
import { StoreBatchRecord } from './entities/store-batch-record.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { StoreService } from './store.service.js';
import { WarehouseService } from './warehouse.service.js';
import { BatchService } from './batch.service.js';
import { DispatchService } from './dispatch.service.js';
import { DispatchItemService } from './dispatch-item.service.js';
import { ReceivingRecordService } from './receiving-record.service.js';
import { StoreController } from './store.controller.js';
import { WarehouseController } from './warehouse.controller.js';
import { BatchController } from './batch.controller.js';
import { DispatchController } from './dispatch.controller.js';
import { DispatchItemController } from './dispatch-item.controller.js';
import { ReceivingRecordController } from './receiving-record.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      Warehouse,
      Batch,
      Dispatch,
      DispatchItem,
      ReceivingRecord,
      StoreInventoryLocation,
      StoreBatchRecord,
      StockLevel,
    ]),
  ],
  controllers: [
    StoreController,
    WarehouseController,
    BatchController,
    DispatchController,
    DispatchItemController,
    ReceivingRecordController,
  ],
  providers: [
    StoreService,
    WarehouseService,
    BatchService,
    DispatchService,
    DispatchItemService,
    ReceivingRecordService,
  ],
  exports: [
    TypeOrmModule,
    StoreService,
    WarehouseService,
    BatchService,
    DispatchService,
    DispatchItemService,
    ReceivingRecordService,
  ],
})
export class WarehouseModule {}
