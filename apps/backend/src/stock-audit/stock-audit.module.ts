import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { Product } from '../inventory/entities/product.entity.js';
import { StockMovementService } from './stock-movement.service.js';
import { StockMovementController } from './stock-movement.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, StockLevel, Product]),
    NotificationsModule,
  ],
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockAuditModule {}
