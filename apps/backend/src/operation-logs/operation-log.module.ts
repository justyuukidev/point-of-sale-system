import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './entities/operation-log.entity.js';
import { OperationLogService } from './operation-log.service.js';
import { OperationLogController } from './operation-log.controller.js';
import { OperationLogSubscriber } from './operation-log.subscriber.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  controllers: [OperationLogController],
  providers: [OperationLogService, OperationLogSubscriber],
  exports: [OperationLogService],
})
export class OperationLogModule {}
