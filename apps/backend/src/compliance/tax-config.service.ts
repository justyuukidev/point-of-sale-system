import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { TaxConfig } from './entities/tax-config.entity.js';
import { CreateTaxConfigDto, UpdateTaxConfigDto } from './dto/index.js';

@Injectable()
export class TaxConfigService {
  constructor(
    @InjectRepository(TaxConfig)
    private readonly taxConfigRepo: Repository<TaxConfig>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTaxConfigDto, tenantId: number): Promise<TaxConfig> {
    const storeId = dto.storeId ?? null;
    const existing = await this.taxConfigRepo.findOne({
      where: {
        storeId: storeId === null ? IsNull() : storeId,
        tenantId,
      },
    });
    if (existing) {
      throw new ConflictException('Tax config already exists for this store');
    }

    const config = this.taxConfigRepo.create({
      ...dto,
      storeId,
      nextOrNumber: dto.nextOrNumber ?? 1,
      nextSiNumber: dto.nextSiNumber ?? 1,
      tenantId,
    });
    return this.taxConfigRepo.save(config);
  }

  async findAllByTenant(tenantId: number): Promise<TaxConfig[]> {
    return this.taxConfigRepo.find({
      where: { tenantId },
      order: { storeId: 'ASC' },
    });
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<TaxConfig> {
    const config = await this.taxConfigRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!config) throw new NotFoundException('Tax config not found');
    return config;
  }

  async findByStore(
    storeId: number | null,
    tenantId: number,
  ): Promise<TaxConfig | null> {
    return this.taxConfigRepo.findOne({
      where: {
        storeId: storeId === null ? IsNull() : storeId,
        tenantId,
      },
    });
  }

  async update(
    uuid: string,
    dto: UpdateTaxConfigDto,
    tenantId: number,
  ): Promise<TaxConfig> {
    const config = await this.findOneByUuid(uuid, tenantId);
    Object.assign(config, dto);
    return this.taxConfigRepo.save(config);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const config = await this.findOneByUuid(uuid, tenantId);
    await this.taxConfigRepo.softRemove(config);
  }

  async getNextOrNumber(
    storeId: number | null,
    tenantId: number,
  ): Promise<string> {
    return this.getNextSequenceNumber('nextOrNumber', storeId, tenantId);
  }

  async getNextSiNumber(
    storeId: number | null,
    tenantId: number,
  ): Promise<string> {
    return this.getNextSequenceNumber('nextSiNumber', storeId, tenantId);
  }

  /**
   * Atomically increment and return the next sequence number using a row-level lock.
   * Prevents duplicate OR/SI numbers under concurrent requests.
   */
  private async getNextSequenceNumber(
    column: 'nextOrNumber' | 'nextSiNumber',
    storeId: number | null,
    tenantId: number,
  ): Promise<string> {
    const extractRows = (queryResult: unknown): Record<string, unknown>[] => {
      if (!Array.isArray(queryResult)) return [];
      if (Array.isArray(queryResult[0])) {
        return queryResult[0] as Record<string, unknown>[];
      }
      return queryResult as Record<string, unknown>[];
    };

    const normalizeSequence = (
      row: Record<string, unknown> | undefined,
    ): number => {
      const raw =
        row?.sequence_number ??
        row?.sequenceNumber ??
        row?.sequencenumber ??
        (row ? Object.values(row)[0] : undefined);
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        throw new InternalServerErrorException(
          'Failed to generate sequence number',
        );
      }
      return parsed;
    };

    return this.dataSource.transaction(async (manager) => {
      const storeCondition =
        storeId === null ? `"storeId" IS NULL` : `"storeId" = $2`;

      // Lock the row and atomically increment
      const result = await manager.query(
        `UPDATE tax_configs
         SET "${column}" = "${column}" + 1
         WHERE "tenantId" = $1 AND ${storeCondition} AND "deletedAt" IS NULL
         RETURNING "${column}" - 1 AS sequence_number`,
        storeId === null ? [tenantId] : [tenantId, storeId],
      );

      const rows = extractRows(result);
      if (rows.length > 0) {
        return String(normalizeSequence(rows[0])).padStart(8, '0');
      }

      // Fallback: try tenant-level config (storeId=null) if store-specific not found
      if (storeId !== null) {
        const fallback = await manager.query(
          `UPDATE tax_configs
           SET "${column}" = "${column}" + 1
           WHERE "tenantId" = $1 AND "storeId" IS NULL AND "deletedAt" IS NULL
           RETURNING "${column}" - 1 AS sequence_number`,
          [tenantId],
        );
        const fallbackRows = extractRows(fallback);
        if (fallbackRows.length > 0) {
          return String(normalizeSequence(fallbackRows[0])).padStart(8, '0');
        }
      }

      throw new NotFoundException('No tax config found for store or tenant');
    });
  }
}
