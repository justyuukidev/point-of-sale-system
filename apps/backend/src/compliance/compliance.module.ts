import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receipt } from './entities/receipt.entity.js';
import { TaxConfig } from './entities/tax-config.entity.js';
import { ZReading } from './entities/z-reading.entity.js';
import { Transaction } from '../pos/entities/transaction.entity.js';
import { LineItem } from '../pos/entities/line-item.entity.js';
import { Payment } from '../pos/entities/payment.entity.js';
import { CashRegisterSession } from '../cash-management/entities/cash-register-session.entity.js';
import { CashDrawerEvent } from '../cash-management/entities/cash-drawer-event.entity.js';
import { TaxConfigService } from './tax-config.service.js';
import { TaxConfigController } from './tax-config.controller.js';
import { ReceiptService } from './receipt.service.js';
import { ReceiptController } from './receipt.controller.js';
import { ZReadingService } from './z-reading.service.js';
import { ZReadingController } from './z-reading.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Receipt,
      TaxConfig,
      ZReading,
      Transaction,
      LineItem,
      Payment,
      CashRegisterSession,
      CashDrawerEvent,
    ]),
  ],
  controllers: [TaxConfigController, ReceiptController, ZReadingController],
  providers: [TaxConfigService, ReceiptService, ZReadingService],
  exports: [TypeOrmModule, TaxConfigService, ReceiptService, ZReadingService],
})
export class ComplianceModule {}
