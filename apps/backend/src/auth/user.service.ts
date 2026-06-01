import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto, UpdateUserDto } from './dto/index.js';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRole } from '../shared/enums/index.js';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(tenantId: number, dto: CreateUserDto): Promise<User> {
    if (dto.role === UserRole.TENANT_ADMIN) {
      throw new BadRequestException(
        'TENANT_ADMIN users can only be created via tenant registration flow',
      );
    }

    // Check username uniqueness within tenant
    const existingUsername = await this.userRepo.findOne({
      where: { username: dto.username, tenantId },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken in this tenant');
    }

    // Check email uniqueness within tenant
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email, tenantId },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered in this tenant');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = this.userRepo.create({
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      storeId: dto.storeId ?? null,
      warehouseId: dto.warehouseId ?? null,
      firebaseUid: dto.firebaseUid ?? null,
      passwordHash,
      tenantId,
    });

    const savedUser = await this.userRepo.save(user);

    if (savedUser.firebaseUid) {
      await this.firebaseService.auth.setCustomUserClaims(
        savedUser.firebaseUid,
        {
          role: savedUser.role,
          tenantId: savedUser.tenantId,
        },
      );
    }

    return savedUser;
  }

  async findAllByTenant(tenantId: number): Promise<User[]> {
    return this.userRepo.find({ where: { tenantId } });
  }

  async findOneByUuid(uuid: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { uuid } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByUuidForTenant(tenantId: number, uuid: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { uuid, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
  }

  async update(
    tenantId: number,
    uuid: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOneByUuidForTenant(tenantId, uuid);

    if (dto.role === UserRole.TENANT_ADMIN) {
      throw new BadRequestException(
        'TENANT_ADMIN role cannot be assigned from this endpoint',
      );
    }

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);

    // Sync role to Firebase only if user has a Firebase account
    if ('role' in dto && dto.role && saved.firebaseUid) {
      await this.firebaseService.auth.setCustomUserClaims(saved.firebaseUid, {
        role: saved.role,
        tenantId: user.tenantId,
      });
    }

    return saved;
  }

  async deactivate(uuid: string): Promise<User> {
    const user = await this.findOneByUuid(uuid);
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async deactivateForTenant(tenantId: number, uuid: string): Promise<User> {
    const user = await this.findOneByUuidForTenant(tenantId, uuid);
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async removeForTenant(tenantId: number, uuid: string): Promise<void> {
    const user = await this.findOneByUuidForTenant(tenantId, uuid);
    await this.userRepo.softRemove(user);
  }
}
