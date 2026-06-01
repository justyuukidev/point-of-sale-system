import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Return } from './entities/return.entity.js';
import { ReturnLineItem } from './entities/return-line-item.entity.js';
import { Transaction } from '../pos/entities/transaction.entity.js';
import { LineItem } from '../pos/entities/line-item.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { ReturnService } from './return.service.js';
import { ReturnController } from './return.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Return,
      ReturnLineItem,
      Transaction,
      LineItem,
      StockLevel,
    ]),
    NotificationsModule,
  ],
  controllers: [ReturnController],
  providers: [ReturnService],
  exports: [TypeOrmModule, ReturnService],
})
export class ReturnsModule {}
