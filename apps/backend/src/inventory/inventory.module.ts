import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { StockLevel } from './entities/stock-level.entity.js';
import { ModifierGroup } from './entities/modifier-group.entity.js';
import { ModifierOption } from './entities/modifier-option.entity.js';
import { ProductModifierGroup } from './entities/product-modifier-group.entity.js';
import { ProductModifierPrice } from './entities/product-modifier-price.entity.js';
import { CategoryService } from './category.service.js';
import { ProductService } from './product.service.js';
import { StockLevelService } from './stock-level.service.js';
import { InventoryEventsService } from './inventory-events.service.js';
import { ModifierService } from './modifier.service.js';
import { CategoryController } from './category.controller.js';
import { ProductController } from './product.controller.js';
import { StockLevelController } from './stock-level.controller.js';
import { InventoryEventsController } from './inventory-events.controller.js';
import { ModifierController } from './modifier.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      StockLevel,
      ModifierGroup,
      ModifierOption,
      ProductModifierGroup,
      ProductModifierPrice,
    ]),
  ],
  controllers: [
    CategoryController,
    ProductController,
    StockLevelController,
    InventoryEventsController,
    ModifierController,
  ],
  providers: [
    CategoryService,
    ProductService,
    StockLevelService,
    InventoryEventsService,
    ModifierService,
  ],
  exports: [
    TypeOrmModule,
    CategoryService,
    ProductService,
    StockLevelService,
    InventoryEventsService,
    ModifierService,
  ],
})
export class InventoryModule {}
