import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';
import { CreateNotificationDto } from './dto/index.js';
import { NotificationGateway } from './notification.gateway.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly gateway: NotificationGateway,
  ) {}

  async create(
    dto: CreateNotificationDto,
    tenantId: number,
  ): Promise<Notification> {
    const notification = this.repo.create({ ...dto, tenantId });
    const saved = await this.repo.save(notification);

    // Emit real-time notification via WebSocket
    if (dto.userId) {
      this.gateway.emitToUser(dto.userId, saved);
    } else if (dto.storeId) {
      this.gateway.emitToStore(dto.storeId, saved);
    } else {
      this.gateway.emitBroadcast(tenantId, saved);
    }

    return saved;
  }

  async findAll(
    tenantId: number,
    userId?: number,
    storeId?: number,
    isRead?: boolean,
    page = 1,
    limit = 50,
  ) {
    const where: any = { tenantId };
    if (userId !== undefined) where.userId = userId;
    if (storeId !== undefined) where.storeId = storeId;
    if (isRead !== undefined) where.isRead = isRead;
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
  ): Promise<Notification | null> {
    return this.repo.findOne({ where: { uuid, tenantId } });
  }

  async markAsRead(
    uuid: string,
    tenantId: number,
  ): Promise<Notification | null> {
    const notification = await this.repo.findOne({ where: { uuid, tenantId } });
    if (!notification) return null;
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async markAllAsRead(tenantId: number, userId: number): Promise<void> {
    await this.repo.update(
      { tenantId, userId, isRead: false },
      { isRead: true },
    );
  }

  async remove(uuid: string, tenantId: number): Promise<boolean> {
    const notification = await this.repo.findOne({ where: { uuid, tenantId } });
    if (!notification) return false;
    await this.repo.remove(notification);
    return true;
  }
}
