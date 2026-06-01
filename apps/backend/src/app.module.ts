import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { DatabaseModule } from './database/database.module';
import { TenantContextModule } from './common/tenant-context/tenant-context.module';
import { CashManagementModule } from './cash-management/cash-management.module';
import { CustomerModule } from './customer/customer.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProcurementModule } from './procurement/procurement.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { PosModule } from './pos/pos.module';
import { ComplianceModule } from './compliance/compliance.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ReturnsModule } from './returns/returns.module';
import { StockAuditModule } from './stock-audit/stock-audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PhysicalInventoryModule } from './physical-inventory/physical-inventory.module';
import { OperationLogModule } from './operation-logs/operation-log.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    AuthModule,
    CashManagementModule,
    ComplianceModule,
    CustomerModule,
    DatabaseModule,
    DiscountsModule,
    FirebaseModule,
    InventoryModule,
    NotificationsModule,
    OperationLogModule,
    PhysicalInventoryModule,
    PosModule,
    ProcurementModule,
    ReturnsModule,
    StockAuditModule,
    TenantContextModule,
    WarehouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
