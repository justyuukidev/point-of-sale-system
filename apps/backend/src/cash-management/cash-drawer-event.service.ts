import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashDrawerEvent } from './entities/cash-drawer-event.entity.js';
import { CashRegisterSessionService } from './cash-register-session.service.js';
import { CreateCashDrawerEventDto } from './dto/index.js';

@Injectable()
export class CashDrawerEventService {
  constructor(
    @InjectRepository(CashDrawerEvent)
    private readonly eventRepo: Repository<CashDrawerEvent>,
    private readonly sessionService: CashRegisterSessionService,
  ) {}

  async create(
    dto: CreateCashDrawerEventDto,
    tenantId: number,
    userId: number,
  ): Promise<CashDrawerEvent> {
    const session = await this.sessionService.findOneByUuid(
      dto.sessionUuid,
      tenantId,
    );
    const event = this.eventRepo.create({
      sessionId: session.id,
      type: dto.type,
      amount: dto.amount,
      reason: dto.reason,
      performedById: userId,
      tenantId,
    });
    return this.eventRepo.save(event);
  }

  async findBySession(
    sessionUuid: string,
    tenantId: number,
  ): Promise<CashDrawerEvent[]> {
    const session = await this.sessionService.findOneByUuid(
      sessionUuid,
      tenantId,
    );
    return this.eventRepo.find({
      where: { sessionId: session.id, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUuid(
    uuid: string,
    tenantId: number,
  ): Promise<CashDrawerEvent> {
    const event = await this.eventRepo.findOne({ where: { uuid, tenantId } });
    if (!event) throw new NotFoundException('Cash drawer event not found');
    return event;
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const event = await this.findOneByUuid(uuid, tenantId);
    await this.eventRepo.softRemove(event);
  }
}
