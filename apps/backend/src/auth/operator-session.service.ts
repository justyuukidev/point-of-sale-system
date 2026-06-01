import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OperatorSession } from './entities/operator-session.entity.js';
import { User } from './entities/user.entity.js';
import { Device } from './entities/device.entity.js';

@Injectable()
export class OperatorSessionService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(OperatorSession)
    private readonly sessionRepo: Repository<OperatorSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  // ─── PIN Management ─────────────────────────────────────────────────────────

  /**
   * Set or update a user's PIN (admin action). Works for any role.
   */
  async setPin(userId: number, pin: string, tenantId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new BadRequestException('User not found in tenant');
    }

    const pinHash = await bcrypt.hash(pin, this.SALT_ROUNDS);
    await this.userRepo.update(user.id, { pinHash });
  }

  /**
   * Remove a user's PIN (admin action).
   */
  async removePin(userId: number, tenantId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new BadRequestException('User not found in tenant');
    }
    await this.userRepo.update(user.id, { pinHash: null });
  }

  /**
   * List all operators for a store with PIN status.
   */
  async listOperators(
    storeId: number,
    tenantId: number,
  ): Promise<Partial<User>[]> {
    const users = await this.userRepo.find({
      where: { storeId, tenantId },
      select: [
        'id',
        'uuid',
        'firstName',
        'lastName',
        'email',
        'role',
        'isActive',
        'pinHash',
      ],
    });
    return users.map(({ pinHash, ...rest }) => ({
      ...rest,
      hasPin: !!pinHash,
    }));
  }

  // ─── Session Management ─────────────────────────────────────────────────────

  /**
   * Switch operator on a device via PIN.
   * Ends any existing active session on that device and starts a new one.
   */
  async switchOperator(
    tenantId: number,
    deviceUuid: string,
    pin: string,
  ): Promise<{ session: OperatorSession; operator: Partial<User> }> {
    // Resolve device
    const device = await this.deviceRepo.findOne({
      where: { uuid: deviceUuid, tenantId, isActive: true },
    });
    if (!device) {
      throw new NotFoundException('Device not found or inactive');
    }

    // Find operator by PIN (search all active users in tenant)
    const users = await this.userRepo.find({
      where: { tenantId, isActive: true },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (!user.pinHash) continue;
      const match = await bcrypt.compare(pin, user.pinHash);
      if (match) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // End any current active session on this device
    await this.sessionRepo.update(
      { deviceId: device.id, tenantId, isActive: true },
      { isActive: false, endedAt: new Date() },
    );

    // Create new session
    const session = this.sessionRepo.create({
      deviceId: device.id,
      operatorId: matchedUser.id,
      tenantId,
      startedAt: new Date(),
      isActive: true,
    });
    const savedSession = await this.sessionRepo.save(session);

    return {
      session: savedSession,
      operator: {
        id: matchedUser.id,
        uuid: matchedUser.uuid,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        role: matchedUser.role,
        storeId: matchedUser.storeId,
      },
    };
  }

  /**
   * End the active session on a device (operator signs out).
   */
  async endSession(tenantId: number, deviceUuid: string): Promise<void> {
    const device = await this.deviceRepo.findOne({
      where: { uuid: deviceUuid, tenantId },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const result = await this.sessionRepo.update(
      { deviceId: device.id, tenantId, isActive: true },
      { isActive: false, endedAt: new Date() },
    );

    if (result.affected === 0) {
      throw new BadRequestException('No active session on this device');
    }
  }

  /**
   * Get the current active operator for a specific device.
   */
  async getActiveOperator(
    tenantId: number,
    deviceUuid: string,
  ): Promise<{
    operator: Partial<User> | null;
    session: OperatorSession | null;
  }> {
    const device = await this.deviceRepo.findOne({
      where: { uuid: deviceUuid, tenantId },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const session = await this.sessionRepo.findOne({
      where: { deviceId: device.id, tenantId, isActive: true },
    });

    if (!session) {
      return { operator: null, session: null };
    }

    const user = await this.userRepo.findOne({
      where: { id: session.operatorId },
      select: ['id', 'uuid', 'firstName', 'lastName', 'role', 'storeId'],
    });

    return { operator: user, session };
  }

  /**
   * Get all active device sessions for a tenant (admin dashboard view).
   */
  async getAllActiveSessions(tenantId: number): Promise<
    Array<{
      device: Partial<Device>;
      operator: Partial<User>;
      startedAt: Date;
    }>
  > {
    const sessions = await this.sessionRepo.find({
      where: { tenantId, isActive: true },
    });

    const results: Array<{
      device: Partial<Device>;
      operator: Partial<User>;
      startedAt: Date;
    }> = [];

    for (const session of sessions) {
      const [device, user] = await Promise.all([
        this.deviceRepo.findOne({
          where: { id: session.deviceId },
          select: ['id', 'uuid', 'deviceName', 'platform', 'isActive'],
        }),
        this.userRepo.findOne({
          where: { id: session.operatorId },
          select: ['id', 'uuid', 'firstName', 'lastName', 'role', 'storeId'],
        }),
      ]);

      if (device && user) {
        results.push({
          device,
          operator: user,
          startedAt: session.startedAt,
        });
      }
    }

    return results;
  }
}
