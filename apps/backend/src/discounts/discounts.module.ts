import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity.js';
import { PromoHistory } from './entities/promo-history.entity.js';
import { DiscountService } from './discount.service.js';
import { DiscountController } from './discount.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Discount, PromoHistory])],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [TypeOrmModule, DiscountService],
})
export class DiscountsModule {}
