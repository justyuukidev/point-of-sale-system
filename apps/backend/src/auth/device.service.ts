import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity.js';
import { RegisterDeviceDto } from './dto/index.js';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async register(
    tenantId: number,
    userId: number,
    dto: RegisterDeviceDto,
  ): Promise<Device> {
    const existing = await this.deviceRepo.findOne({
      where: { deviceFingerprint: dto.deviceFingerprint },
    });
    if (existing) {
      throw new ConflictException('Device already registered');
    }

    const device = this.deviceRepo.create({
      ...dto,
      userId,
      tenantId,
    });
    return this.deviceRepo.save(device);
  }

  async findByUser(userId: number): Promise<Device[]> {
    return this.deviceRepo.find({ where: { userId } });
  }

  async findOneByUuid(uuid: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { uuid } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async deactivate(uuid: string): Promise<Device> {
    const device = await this.findOneByUuid(uuid);
    device.isActive = false;
    return this.deviceRepo.save(device);
  }

  async remove(uuid: string): Promise<void> {
    const device = await this.findOneByUuid(uuid);
    await this.deviceRepo.softRemove(device);
  }
}
