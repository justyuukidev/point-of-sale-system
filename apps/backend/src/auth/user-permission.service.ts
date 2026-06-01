import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission } from './entities/user-permission.entity.js';
import { Permission } from '../shared/enums/index.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UserPermissionService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly permissionRepo: Repository<UserPermission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async ensureTenantUser(
    userId: number,
    tenantId: number,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found in tenant');
    }
  }

  async grant(
    userId: number,
    permission: Permission,
    tenantId: number,
  ): Promise<UserPermission> {
    await this.ensureTenantUser(userId, tenantId);

    const existing = await this.permissionRepo.findOne({
      where: { userId, permission, tenantId },
    });
    if (existing) {
      throw new ConflictException(`User already has permission: ${permission}`);
    }

    const entity = this.permissionRepo.create({ userId, permission, tenantId });
    return this.permissionRepo.save(entity);
  }

  async revoke(
    userId: number,
    permission: Permission,
    tenantId: number,
  ): Promise<void> {
    await this.ensureTenantUser(userId, tenantId);

    const entity = await this.permissionRepo.findOne({
      where: { userId, permission, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(
        `User does not have permission: ${permission}`,
      );
    }
    await this.permissionRepo.remove(entity);
  }

  async findByUser(
    userId: number,
    tenantId: number,
  ): Promise<UserPermission[]> {
    await this.ensureTenantUser(userId, tenantId);
    return this.permissionRepo.find({ where: { userId, tenantId } });
  }

  async setPermissions(
    userId: number,
    permissions: Permission[],
    tenantId: number,
  ): Promise<UserPermission[]> {
    await this.ensureTenantUser(userId, tenantId);

    // Remove all existing permissions
    const existing = await this.permissionRepo.find({
      where: { userId, tenantId },
    });
    if (existing.length > 0) {
      await this.permissionRepo.remove(existing);
    }

    // Add new permissions
    const entities = permissions.map((permission) =>
      this.permissionRepo.create({ userId, permission, tenantId }),
    );
    return this.permissionRepo.save(entities);
  }

  async hasPermission(
    userId: number,
    permission: Permission,
    tenantId: number,
  ): Promise<boolean> {
    await this.ensureTenantUser(userId, tenantId);

    const entity = await this.permissionRepo.findOne({
      where: { userId, permission, tenantId },
    });
    return !!entity;
  }
}
