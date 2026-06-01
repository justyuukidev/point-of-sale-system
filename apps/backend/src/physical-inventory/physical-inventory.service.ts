import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockCount } from './entities/stock-count.entity.js';
import { StockCountItem } from './entities/stock-count-item.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { StockCountStatus } from '../shared/enums/index.js';
import { CreateStockCountDto, RecordCountDto } from './dto/index.js';

@Injectable()
export class PhysicalInventoryService {
  constructor(
    @InjectRepository(StockCount)
    private readonly stockCountRepo: Repository<StockCount>,
    @InjectRepository(StockCountItem)
    private readonly stockCountItemRepo: Repository<StockCountItem>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Start a new stock count session for a store.
   * Snapshots all current stock levels as StockCountItems.
   */
  async create(
    dto: CreateStockCountDto,
    initiatedById: number,
    tenantId: number,
  ): Promise<StockCount> {
    // Get all stock levels for this store
    const stockLevels = await this.stockLevelRepo.find({
      where: { storeId: dto.storeId, tenantId },
    });

    if (stockLevels.length === 0) {
      throw new BadRequestException(
        'No stock levels found for this store. Cannot start a count.',
      );
    }

    // Create the count header
    const stockCount = this.stockCountRepo.create({
      storeId: dto.storeId,
      initiatedById,
      status: StockCountStatus.IN_PROGRESS,
      startedAt: new Date(),
      totalProducts: stockLevels.length,
      notes: dto.notes ?? null,
      tenantId,
    });
    const saved = await this.stockCountRepo.save(stockCount);

    // Create count items with system quantities snapshot
    const items = stockLevels.map((sl) =>
      this.stockCountItemRepo.create({
        stockCountId: saved.id,
        productId: sl.productId,
        systemQuantity: sl.currentQuantity,
        tenantId,
      }),
    );
    await this.stockCountItemRepo.save(items);

    return this.findOne(saved.uuid, tenantId);
  }

  /**
   * Get a stock count with its items.
   */
  async findOne(uuid: string, tenantId: number): Promise<StockCount> {
    const stockCount = await this.stockCountRepo.findOne({
      where: { uuid, tenantId },
      relations: ['items', 'items.product'],
    });
    if (!stockCount) throw new NotFoundException('Stock count not found');
    return stockCount;
  }

  /**
   * List stock counts for a store (most recent first).
   */
  async findByStore(storeId: number, tenantId: number): Promise<StockCount[]> {
    return this.stockCountRepo.find({
      where: { storeId, tenantId },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Record a physical count for a specific item.
   */
  async recordCount(
    stockCountUuid: string,
    itemId: number,
    dto: RecordCountDto,
    tenantId: number,
  ): Promise<StockCountItem> {
    const stockCount = await this.stockCountRepo.findOne({
      where: { uuid: stockCountUuid, tenantId },
    });
    if (!stockCount) throw new NotFoundException('Stock count not found');

    if (stockCount.status !== StockCountStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only record counts on an in-progress stock count',
      );
    }

    const item = await this.stockCountItemRepo.findOne({
      where: { id: itemId, stockCountId: stockCount.id, tenantId },
    });
    if (!item) throw new NotFoundException('Stock count item not found');

    item.countedQuantity = dto.countedQuantity;
    item.discrepancy = dto.countedQuantity - item.systemQuantity;
    item.notes = dto.notes ?? item.notes;

    return this.stockCountItemRepo.save(item);
  }

  /**
   * Mark stock count as complete (pending approval).
   * All items must have been counted.
   */
  async complete(uuid: string, tenantId: number): Promise<StockCount> {
    const stockCount = await this.stockCountRepo.findOne({
      where: { uuid, tenantId },
      relations: ['items'],
    });
    if (!stockCount) throw new NotFoundException('Stock count not found');

    if (stockCount.status !== StockCountStatus.IN_PROGRESS) {
      throw new BadRequestException('Stock count is not in progress');
    }

    // Check all items have been counted
    const uncounted = stockCount.items!.filter(
      (item) => item.countedQuantity === null,
    );
    if (uncounted.length > 0) {
      throw new BadRequestException(
        `${uncounted.length} item(s) have not been counted yet`,
      );
    }

    // Calculate discrepancy count
    stockCount.discrepancyCount = stockCount.items!.filter(
      (item) => item.discrepancy !== 0,
    ).length;
    stockCount.status = StockCountStatus.PENDING_APPROVAL;
    stockCount.completedAt = new Date();

    return this.stockCountRepo.save(stockCount);
  }

  /**
   * Approve stock count and apply adjustments to inventory.
   * Uses a single transaction for atomicity.
   */
  async approve(
    uuid: string,
    approvedById: number,
    tenantId: number,
  ): Promise<StockCount> {
    const stockCount = await this.stockCountRepo.findOne({
      where: { uuid, tenantId },
      relations: ['items'],
    });
    if (!stockCount) throw new NotFoundException('Stock count not found');

    if (stockCount.status !== StockCountStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Stock count must be pending approval to approve',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      // Apply adjustments for items with discrepancies
      const itemsWithDiscrepancy = stockCount.items!.filter(
        (item) => item.discrepancy !== null && item.discrepancy !== 0,
      );

      for (const item of itemsWithDiscrepancy) {
        // Update stock level to match counted quantity
        await manager.query(
          `UPDATE stock_levels
           SET "currentQuantity" = $1,
               "lastCountedAt" = NOW()
           WHERE "storeId" = $2 AND "productId" = $3 AND "tenantId" = $4 AND "deletedAt" IS NULL`,
          [item.countedQuantity, stockCount.storeId, item.productId, tenantId],
        );
      }

      // Update items without discrepancy — just mark lastCountedAt
      const itemsWithoutDiscrepancy = stockCount.items!.filter(
        (item) => item.discrepancy === 0,
      );
      if (itemsWithoutDiscrepancy.length > 0) {
        const productIds = itemsWithoutDiscrepancy.map((i) => i.productId);
        await manager.query(
          `UPDATE stock_levels
           SET "lastCountedAt" = NOW()
           WHERE "storeId" = $1 AND "productId" = ANY($2) AND "tenantId" = $3 AND "deletedAt" IS NULL`,
          [stockCount.storeId, productIds, tenantId],
        );
      }

      // Mark stock count as approved
      stockCount.status = StockCountStatus.APPROVED;
      stockCount.approvedById = approvedById;
      await manager.save(StockCount, stockCount);
    });

    return this.findOne(uuid, tenantId);
  }

  /**
   * Cancel a stock count (only if in-progress or pending approval).
   */
  async cancel(uuid: string, tenantId: number): Promise<StockCount> {
    const stockCount = await this.stockCountRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!stockCount) throw new NotFoundException('Stock count not found');

    if (stockCount.status === StockCountStatus.APPROVED) {
      throw new BadRequestException('Cannot cancel an approved stock count');
    }

    stockCount.status = StockCountStatus.CANCELLED;
    return this.stockCountRepo.save(stockCount);
  }
}
