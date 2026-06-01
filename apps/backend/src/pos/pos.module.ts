import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { LineItem } from './entities/line-item.entity.js';
import { LineItemModifier } from './entities/line-item-modifier.entity.js';
import { Payment } from './entities/payment.entity.js';
import { Product } from '../inventory/entities/product.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { ModifierOption } from '../inventory/entities/modifier-option.entity.js';
import { ProductModifierPrice } from '../inventory/entities/product-modifier-price.entity.js';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      LineItem,
      LineItemModifier,
      Payment,
      Product,
      StockLevel,
      ModifierOption,
      ProductModifierPrice,
    ]),
    NotificationsModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TypeOrmModule, TransactionService],
})
export class PosModule {}
