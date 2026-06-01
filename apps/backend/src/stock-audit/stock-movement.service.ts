import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { Product } from '../inventory/entities/product.entity.js';
import { CreateStockMovementDto } from './dto/index.js';
import {
  StockMovementType,
  NotificationType,
  NotificationChannel,
} from '../shared/enums/index.js';
import { NotificationService } from '../notifications/notification.service.js';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly repo: Repository<StockMovement>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateStockMovementDto,
    performedById: number,
    tenantId: number,
  ): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      // Lock the stock level row (or create if doesn't exist)
      const stockLevel = await manager
        .getRepository(StockLevel)
        .createQueryBuilder('sl')
        .setLock('pessimistic_write')
        .where('sl."storeId" = :storeId', { storeId: dto.storeId })
        .andWhere('sl."productId" = :productId', { productId: dto.productId })
        .andWhere('sl."tenantId" = :tenantId', { tenantId })
        .andWhere('sl."deletedAt" IS NULL')
        .getOne();

      const quantityBefore = stockLevel?.currentQuantity ?? 0;
      const quantityAfter = quantityBefore + dto.quantityChange;

      if (quantityAfter < 0) {
        throw new BadRequestException('Insufficient stock for this movement');
      }

      // Create movement record
      const movement = manager.create(StockMovement, {
        ...dto,
        quantityBefore,
        quantityAfter,
        performedById,
        tenantId,
      });
      const saved = await manager.save(StockMovement, movement);

      // Update or create stock level
      if (stockLevel) {
        stockLevel.currentQuantity = quantityAfter;
        if (dto.quantityChange > 0) {
          stockLevel.lastRestockedAt = new Date();
        }
        await manager.save(StockLevel, stockLevel);
      } else {
        const newSl = manager.create(StockLevel, {
          storeId: dto.storeId,
          productId: dto.productId,
          currentQuantity: quantityAfter,
          tenantId,
        });
        await manager.save(StockLevel, newSl);
      }

      // Check low stock threshold on negative movements
      if (dto.quantityChange < 0) {
        const product = await manager.findOne(Product, {
          where: { id: dto.productId, tenantId },
        });
        if (product?.reorderPoint && quantityAfter <= product.reorderPoint) {
          await this.notificationService.create(
            {
              storeId: dto.storeId,
              type: NotificationType.LOW_STOCK,
              channel: NotificationChannel.IN_APP,
              title: 'Low Stock Alert',
              message: `${product.name} is running low (${quantityAfter} remaining, reorder point: ${product.reorderPoint})`,
            },
            tenantId,
          );
        }
      }

      return saved;
    });
  }

  async findAll(
    tenantId: number,
    storeId?: number,
    productId?: number,
    movementType?: StockMovementType,
    page = 1,
    limit = 50,
  ) {
    const where: any = { tenantId };
    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;
    if (movementType) where.movementType = movementType;
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<StockMovement | null> {
    return this.repo.findOne({ where: { uuid, tenantId } });
  }
}
