import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockLevel } from './entities/stock-level.entity.js';
import { CreateStockLevelDto, UpdateStockLevelDto } from './dto/index.js';

@Injectable()
export class StockLevelService {
  constructor(
    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateStockLevelDto,
    tenantId: number,
  ): Promise<StockLevel> {
    // Check uniqueness (store + product per tenant)
    const existing = await this.stockLevelRepo.findOne({
      where: { storeId: dto.storeId, productId: dto.productId, tenantId },
    });
    if (existing) {
      throw new ConflictException(
        'Stock level already exists for this store/product combination',
      );
    }

    const stockLevel = this.stockLevelRepo.create({ ...dto, tenantId });
    return this.stockLevelRepo.save(stockLevel);
  }

  async findByStore(storeId: number, tenantId: number): Promise<StockLevel[]> {
    return this.stockLevelRepo.find({ where: { storeId, tenantId } });
  }

  async findByProduct(
    productId: number,
    tenantId: number,
  ): Promise<StockLevel[]> {
    return this.stockLevelRepo.find({ where: { productId, tenantId } });
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<StockLevel> {
    const stockLevel = await this.stockLevelRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!stockLevel) throw new NotFoundException('Stock level not found');
    return stockLevel;
  }

  async update(
    uuid: string,
    dto: UpdateStockLevelDto,
    tenantId: number,
  ): Promise<StockLevel> {
    const stockLevel = await this.findOneByUuid(uuid, tenantId);
    Object.assign(stockLevel, dto);
    return this.stockLevelRepo.save(stockLevel);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const stockLevel = await this.findOneByUuid(uuid, tenantId);
    await this.stockLevelRepo.softRemove(stockLevel);
  }

  /**
   * Atomically adjust stock quantity for a store+product.
   * Use negative delta for sales/deductions, positive for restocks.
   * Prevents going below zero.
   */
  async adjustQuantity(
    storeId: number,
    productId: number,
    delta: number,
    tenantId: number,
  ): Promise<StockLevel> {
    return this.dataSource.transaction(async (manager) => {
      const stockLevelRepo = manager.getRepository(StockLevel);

      // Lock the row for update
      const stockLevel = await stockLevelRepo
        .createQueryBuilder('sl')
        .setLock('pessimistic_write')
        .where('sl."storeId" = :storeId', { storeId })
        .andWhere('sl."productId" = :productId', { productId })
        .andWhere('sl."tenantId" = :tenantId', { tenantId })
        .andWhere('sl."deletedAt" IS NULL')
        .getOne();

      if (!stockLevel) {
        throw new NotFoundException(
          `Stock level not found for store ${storeId}, product ${productId}`,
        );
      }

      const newQuantity = stockLevel.currentQuantity + delta;
      if (newQuantity < 0) {
        throw new BadRequestException(
          `Insufficient stock: current=${stockLevel.currentQuantity}, requested adjustment=${delta}`,
        );
      }

      stockLevel.currentQuantity = newQuantity;
      if (delta > 0) {
        stockLevel.lastRestockedAt = new Date();
      }
      return stockLevelRepo.save(stockLevel);
    });
  }

  /**
   * Batch adjust multiple products' stock in a single transaction (for POS checkout).
   */
  async batchAdjustQuantity(
    adjustments: Array<{ storeId: number; productId: number; delta: number }>,
    tenantId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const adj of adjustments) {
        const result = await manager.query(
          `UPDATE stock_levels
           SET "currentQuantity" = "currentQuantity" + $1,
               "lastRestockedAt" = CASE WHEN $1 > 0 THEN NOW() ELSE "lastRestockedAt" END
           WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL
             AND "currentQuantity" + $1 >= 0
           RETURNING id`,
          [adj.delta, adj.storeId, adj.productId, tenantId],
        );
        if (result.length === 0) {
          throw new BadRequestException(
            `Insufficient stock or stock level not found for product ${adj.productId} at store ${adj.storeId}`,
          );
        }
      }
    });
  }
}
