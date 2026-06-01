import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import { UserRole } from '../shared/enums/index.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly firebaseService: FirebaseService,
    private readonly dataSource: DataSource,
  ) {}

  /** Self-service registration: creates Tenant + first TENANT_ADMIN user atomically. */
  async register(firebaseUid: string, email: string, dto: RegisterDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Create tenant (self-referencing pattern)
      const tenantData = manager.create(Tenant, {
        name: dto.businessName,
        businessName: dto.businessName,
        tin: dto.tin,
        address: dto.address,
        contactEmail: email,
        contactPhone: dto.contactPhone,
        birMinNumber: dto.birMinNumber ?? null,
        birPtuNumber: dto.birPtuNumber ?? null,
        tenantId: 0, // placeholder
      });
      const savedTenant = await manager.save(Tenant, tenantData);
      savedTenant.tenantId = savedTenant.id;
      await manager.save(Tenant, savedTenant);

      // 2. Create admin user linked to tenant
      const userData = manager.create(User, {
        firebaseUid,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.TENANT_ADMIN,
        tenantId: savedTenant.id,
        isActive: true,
      });
      const savedUser = await manager.save(User, userData);

      // 3. Sync custom claims to Firebase so subsequent JWTs carry role + tenantId
      await this.firebaseService.auth.setCustomUserClaims(firebaseUid, {
        role: UserRole.TENANT_ADMIN,
        tenantId: savedTenant.id,
      });

      return {
        tenant: { uuid: savedTenant.uuid, name: savedTenant.businessName },
        user: {
          uuid: savedUser.uuid,
          email: savedUser.email,
          role: savedUser.role,
        },
        message:
          'Registration successful. Sign out and sign back in to refresh your token with the new claims.',
      };
    });
  }
}
