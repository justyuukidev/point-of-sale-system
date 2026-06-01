import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity.js';
import { CashDrawerEvent } from './entities/cash-drawer-event.entity.js';
import {
  CashRegisterSessionStatus,
  CashDrawerEventType,
} from '../shared/enums/index.js';
import {
  CreateCashRegisterSessionDto,
  CloseCashRegisterSessionDto,
} from './dto/index.js';

@Injectable()
export class CashRegisterSessionService {
  constructor(
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepo: Repository<CashRegisterSession>,
    @InjectRepository(CashDrawerEvent)
    private readonly drawerEventRepo: Repository<CashDrawerEvent>,
  ) {}

  async create(
    dto: CreateCashRegisterSessionDto,
    tenantId: number,
    operatorId: number,
  ): Promise<CashRegisterSession> {
    // Prevent multiple open sessions on the same device
    const existingOpen = await this.sessionRepo.findOne({
      where: {
        deviceId: dto.deviceId,
        tenantId,
        status: CashRegisterSessionStatus.OPEN,
      },
    });
    if (existingOpen) {
      throw new BadRequestException(
        'There is already an open session on this device. Close it before opening a new one.',
      );
    }

    const session = this.sessionRepo.create({
      ...dto,
      tenantId,
      openedById: operatorId,
      status: CashRegisterSessionStatus.OPEN,
    });
    return this.sessionRepo.save(session);
  }

  async findAllByTenant(
    tenantId: number,
    options?: {
      status?: CashRegisterSessionStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ data: CashRegisterSession[]; total: number }> {
    const where: any = { tenantId };
    if (options?.status) where.status = options.status;

    const [data, total] = await this.sessionRepo.findAndCount({
      where,
      order: { openedAt: 'DESC' },
      take: Math.min(options?.limit ?? 50, 200),
      skip: options?.offset ?? 0,
    });

    return { data, total };
  }

  async findOpenByStore(
    storeId: number,
    tenantId: number,
  ): Promise<CashRegisterSession[]> {
    return this.sessionRepo.find({
      where: { storeId, tenantId, status: CashRegisterSessionStatus.OPEN },
      order: { openedAt: 'DESC' },
    });
  }

  async findOneByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<CashRegisterSession> {
    const session = await this.sessionRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!session)
      throw new NotFoundException('Cash register session not found');
    return session;
  }

  async close(
    uuid: string,
    dto: CloseCashRegisterSessionDto,
    tenantId: number,
    operatorId: number,
  ): Promise<CashRegisterSession> {
    const session = await this.findOneByUuid(uuid, tenantId);
    if (session.status !== CashRegisterSessionStatus.OPEN) {
      throw new BadRequestException('Session is not open');
    }

    // Calculate expectedCash: opening + cash_in - cash_out
    const drawerEvents = await this.drawerEventRepo.find({
      where: { sessionId: session.id, tenantId },
    });

    let cashInTotal = 0;
    let cashOutTotal = 0;
    for (const event of drawerEvents) {
      if (event.type === CashDrawerEventType.CASH_IN) {
        cashInTotal += parseFloat(event.amount);
      } else {
        cashOutTotal += parseFloat(event.amount);
      }
    }

    const openingCash = parseFloat(session.openingCash);
    const totalCashSales = session.totalCashSales
      ? parseFloat(session.totalCashSales)
      : 0;
    const totalVoidAmount = session.totalVoidAmount
      ? parseFloat(session.totalVoidAmount)
      : 0;
    const totalReturnAmount = session.totalReturnAmount
      ? parseFloat(session.totalReturnAmount)
      : 0;

    const expectedCash =
      openingCash +
      totalCashSales -
      totalVoidAmount -
      totalReturnAmount +
      cashInTotal -
      cashOutTotal;

    const actualCash = parseFloat(dto.actualCash);
    const cashDifference = actualCash - expectedCash;

    session.status = CashRegisterSessionStatus.CLOSED;
    session.closedById = operatorId;
    session.closedAt = new Date();
    session.actualCash = dto.actualCash;
    session.expectedCash = expectedCash.toFixed(4);
    session.cashDifference = cashDifference.toFixed(4);
    if (dto.notes) session.notes = dto.notes;

    return this.sessionRepo.save(session);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const session = await this.findOneByUuid(uuid, tenantId);
    await this.sessionRepo.softRemove(session);
  }
}
