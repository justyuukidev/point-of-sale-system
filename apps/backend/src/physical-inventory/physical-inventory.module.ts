import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockCount } from './entities/stock-count.entity.js';
import { StockCountItem } from './entities/stock-count-item.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { PhysicalInventoryService } from './physical-inventory.service.js';
import { PhysicalInventoryController } from './physical-inventory.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([StockCount, StockCountItem, StockLevel])],
  controllers: [PhysicalInventoryController],
  providers: [PhysicalInventoryService],
  exports: [PhysicalInventoryService],
})
export class PhysicalInventoryModule {}
