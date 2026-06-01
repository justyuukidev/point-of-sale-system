import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity.js';
import { CashDrawerEvent } from './entities/cash-drawer-event.entity.js';
import { CashRegisterSessionService } from './cash-register-session.service.js';
import { CashDrawerEventService } from './cash-drawer-event.service.js';
import { CashRegisterSessionController } from './cash-register-session.controller.js';
import { CashDrawerEventController } from './cash-drawer-event.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegisterSession, CashDrawerEvent])],
  controllers: [CashRegisterSessionController, CashDrawerEventController],
  providers: [CashRegisterSessionService, CashDrawerEventService],
  exports: [TypeOrmModule, CashRegisterSessionService, CashDrawerEventService],
})
export class CashManagementModule {}
