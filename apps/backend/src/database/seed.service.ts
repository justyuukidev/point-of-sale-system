import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant } from '../auth/entities/tenant.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { Store } from '../warehouse/entities/store.entity.js';
import { Warehouse } from '../warehouse/entities/warehouse.entity.js';
import { Category } from '../inventory/entities/category.entity.js';
import { Product } from '../inventory/entities/product.entity.js';
import { StockLevel } from '../inventory/entities/stock-level.entity.js';
import { TaxConfig } from '../compliance/entities/tax-config.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Discount } from '../discounts/entities/discount.entity.js';
import { Supplier } from '../procurement/entities/supplier.entity.js';
import { UserRole, VatType, DiscountType } from '../shared/enums/index.js';
import { FirebaseService } from '../firebase/firebase.service';

/**
 * Auto-seed service — runs on app startup when AUTO_SEED=true env var is set.
 * Idempotent: skips if demo tenant already exists.
 * When using the Firebase emulator, re-syncs Firebase users if DB is already seeded
 * (handles emulator restarts that lose user data).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  private static readonly SEED_PASSWORDS: Record<string, string> = {
    'admin@jssi-demo.ph': 'Admin123!',
    'manager@jssi-demo.ph': 'Manager123!',
    'cashier@jssi-demo.ph': 'Cashier123!',
    'warehouse@jssi-demo.ph': 'Warehouse123!',
  };

  constructor(
    private readonly dataSource: DataSource,
    private readonly firebaseService: FirebaseService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.AUTO_SEED !== 'true') return;
    this.logger.log('AUTO_SEED=true detected, checking if seed is needed...');

    const isEmulator = !!process.env['FIREBASE_AUTH_EMULATOR_HOST'];

    // Fail early if emulator is expected but not reachable
    if (isEmulator) {
      await this.ensureEmulatorReachable();
    }

    const tenantRepo = this.dataSource.getRepository(Tenant);
    const existingTenant = await tenantRepo.findOne({
      where: { tin: '000-000-000-000' },
    });

    if (existingTenant && isEmulator) {
      // DB is seeded but emulator may have lost user data — re-sync
      await this.syncFirebaseEmulatorUsers(existingTenant.id);
      return;
    }

    if (existingTenant) {
      this.logger.log(
        'Database already seeded (demo tenant exists). Skipping.',
      );
      return;
    }

    await this.seed();
  }

  private async ensureEmulatorReachable() {
    const emulatorHost = process.env['FIREBASE_AUTH_EMULATOR_HOST'];
    try {
      await this.firebaseService.auth.listUsers(1);
    } catch {
      this.logger.error(
        `Firebase Auth Emulator at ${emulatorHost} is not reachable. ` +
          `Start it with: firebase emulators:start --only auth`,
      );
      throw new Error(
        'Firebase Auth Emulator is required for seeding but is not running.',
      );
    }
  }

  private async syncFirebaseEmulatorUsers(tenantId: number) {
    this.logger.log('Emulator detected — syncing Firebase users with DB...');

    const userRepo = this.dataSource.getRepository(User);
    const users = await userRepo.find({ where: { tenantId } });

    for (const user of users) {
      let firebaseUser;
      try {
        firebaseUser = await this.firebaseService.auth.getUserByEmail(
          user.email,
        );
      } catch {
        // User doesn't exist in emulator — re-create with original password
        const password = SeedService.SEED_PASSWORDS[user.email] || 'Test123!';
        firebaseUser = await this.firebaseService.auth.createUser({
          email: user.email,
          password,
          displayName: `${user.firstName} ${user.lastName}`,
        });
        this.logger.log(`  Re-created Firebase user: ${user.email}`);
      }

      // Update firebaseUid in DB if it changed
      if (firebaseUser.uid !== user.firebaseUid) {
        await userRepo.update(user.id, { firebaseUid: firebaseUser.uid });
        this.logger.log(`  Updated firebaseUid for ${user.email}`);
      }

      // Re-set custom claims (emulator lost them)
      await this.firebaseService.auth.setCustomUserClaims(firebaseUser.uid, {
        role: user.role,
        tenantId,
      });
    }

    this.logger.log('Firebase emulator users synced successfully.');
  }

  async seed() {
    this.logger.log('Seeding database...');

    const tenantRepo = this.dataSource.getRepository(Tenant);
    const userRepo = this.dataSource.getRepository(User);
    const storeRepo = this.dataSource.getRepository(Store);
    const warehouseRepo = this.dataSource.getRepository(Warehouse);
    const categoryRepo = this.dataSource.getRepository(Category);
    const productRepo = this.dataSource.getRepository(Product);
    const stockLevelRepo = this.dataSource.getRepository(StockLevel);
    const taxConfigRepo = this.dataSource.getRepository(TaxConfig);
    const customerRepo = this.dataSource.getRepository(Customer);
    const discountRepo = this.dataSource.getRepository(Discount);
    const supplierRepo = this.dataSource.getRepository(Supplier);

    // ─── Tenant ──────────────────────────────────────────────────────────────
    const tenant = await tenantRepo.save(
      tenantRepo.create({
        name: 'JSSI Demo',
        businessName: 'JSSI Food Services Inc.',
        tin: '000-000-000-000',
        address: '123 Commissary Road, Quezon City, Metro Manila',
        contactEmail: 'admin@jssi-demo.ph',
        contactPhone: '+63-917-000-0000',
        birMinNumber: 'MIN-2026-000001',
        birPtuNumber: 'PTU-2026-000001',
        tenantId: 0,
      }),
    );
    tenant.tenantId = tenant.id;
    await tenantRepo.save(tenant);
    const T = tenant.id;
    this.logger.log(`Tenant: ${tenant.businessName} (id=${T})`);

    // ─── Firebase Users + DB Users ───────────────────────────────────────────
    const usersData = [
      {
        email: 'admin@jssi-demo.ph',
        password: 'Admin123!',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        role: UserRole.TENANT_ADMIN,
      },
      {
        email: 'manager@jssi-demo.ph',
        password: 'Manager123!',
        firstName: 'Maria',
        lastName: 'Santos',
        role: UserRole.STORE_MANAGER,
      },
      {
        email: 'cashier@jssi-demo.ph',
        password: 'Cashier123!',
        firstName: 'Pedro',
        lastName: 'Garcia',
        role: UserRole.CASHIER,
      },
      {
        email: 'warehouse@jssi-demo.ph',
        password: 'Warehouse123!',
        firstName: 'Jose',
        lastName: 'Reyes',
        role: UserRole.WAREHOUSE_MANAGER,
      },
    ];

    const dbUsers: User[] = [];
    for (const u of usersData) {
      let firebaseUser;
      try {
        firebaseUser = await this.firebaseService.auth.createUser({
          email: u.email,
          password: u.password,
          displayName: `${u.firstName} ${u.lastName}`,
        });
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'auth/email-already-exists') {
          firebaseUser = await this.firebaseService.auth.getUserByEmail(
            u.email,
          );
        } else {
          throw err;
        }
      }
      await this.firebaseService.auth.setCustomUserClaims(firebaseUser.uid, {
        role: u.role,
        tenantId: T,
      });
      const dbUser = await userRepo.save(
        userRepo.create({
          firebaseUid: firebaseUser.uid,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          tenantId: T,
          isActive: true,
        }),
      );
      dbUsers.push(dbUser);
      this.logger.log(`User: ${u.email} (${u.role})`);
    }

    // ─── Store ───────────────────────────────────────────────────────────────
    const store = await storeRepo.save(
      storeRepo.create({
        name: 'JSSI Main Branch',
        address: '456 Retail Avenue, Makati City',
        contactPhone: '+63-917-111-1111',
        tenantId: T,
      }),
    );
    dbUsers[1].storeId = store.id;
    dbUsers[2].storeId = store.id;
    await userRepo.save(dbUsers[1]);
    await userRepo.save(dbUsers[2]);

    // ─── Warehouse ───────────────────────────────────────────────────────────
    const warehouse = await warehouseRepo.save(
      warehouseRepo.create({
        name: 'JSSI Central Commissary',
        address: '789 Industrial Park, Pasig City',
        contactPhone: '+63-917-222-2222',
        tenantId: T,
      }),
    );
    dbUsers[3].warehouseId = warehouse.id;
    await userRepo.save(dbUsers[3]);

    // ─── Categories ──────────────────────────────────────────────────────────
    const categoriesData = [
      'Beverages',
      'Snacks',
      'Canned Goods',
      'Personal Care',
      'Dairy',
      'Frozen Foods',
      'Condiments',
      'Rice & Grains',
    ];
    const categories: Category[] = [];
    for (const name of categoriesData) {
      categories.push(
        await categoryRepo.save(categoryRepo.create({ name, tenantId: T })),
      );
    }
    this.logger.log(`Categories: ${categories.length} created`);

    // ─── Products (31 SKUs) ──────────────────────────────────────────────────
    const productsData = [
      {
        name: 'Coca-Cola 330ml',
        sku: 'BEV-COKE-330',
        catIdx: 0,
        price: '35.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'Coca-Cola 1.5L',
        sku: 'BEV-COKE-1500',
        catIdx: 0,
        price: '75.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'Sprite 330ml',
        sku: 'BEV-SPRT-330',
        catIdx: 0,
        price: '35.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'C2 Green Tea 500ml',
        sku: 'BEV-C2GT-500',
        catIdx: 0,
        price: '25.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'Nescafe 3-in-1 (10 sachet)',
        sku: 'BEV-NES3-10',
        catIdx: 0,
        price: '85.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Piattos Cheese 85g',
        sku: 'SNK-PIAT-85C',
        catIdx: 1,
        price: '42.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Nova Cheddar 78g',
        sku: 'SNK-NOVA-78C',
        catIdx: 1,
        price: '38.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'SkyFlakes 250g',
        sku: 'SNK-SKYF-250',
        catIdx: 1,
        price: '48.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Oishi Prawn Crackers 60g',
        sku: 'SNK-OPRC-60',
        catIdx: 1,
        price: '28.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Chippy BBQ 110g',
        sku: 'SNK-CHPB-110',
        catIdx: 1,
        price: '35.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Century Tuna Flakes 155g',
        sku: 'CAN-CTUN-155',
        catIdx: 2,
        price: '45.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'Argentina Corned Beef 260g',
        sku: 'CAN-ACBF-260',
        catIdx: 2,
        price: '82.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'Spam Classic 340g',
        sku: 'CAN-SPAM-340',
        catIdx: 2,
        price: '285.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'Del Monte Fruit Cocktail 432g',
        sku: 'CAN-DMFC-432',
        catIdx: 2,
        price: '95.00',
        unit: 'can',
        vatRate: '12.00',
      },
      {
        name: 'Safeguard Soap 135g',
        sku: 'PC-SFGD-135',
        catIdx: 3,
        price: '52.00',
        unit: 'bar',
        vatRate: '12.00',
      },
      {
        name: 'Head & Shoulders 180ml',
        sku: 'PC-HDSN-180',
        catIdx: 3,
        price: '165.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'Colgate Triple Action 150ml',
        sku: 'PC-CLGT-150',
        catIdx: 3,
        price: '88.00',
        unit: 'tube',
        vatRate: '12.00',
      },
      {
        name: 'Bear Brand Sterilized Milk 200ml',
        sku: 'DRY-BRBM-200',
        catIdx: 4,
        price: '28.00',
        unit: 'box',
        vatRate: '0.00',
        vatType: VatType.VAT_EXEMPT,
      },
      {
        name: 'Nestle All Purpose Cream 250ml',
        sku: 'DRY-NAPC-250',
        catIdx: 4,
        price: '62.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Eden Cheese 165g',
        sku: 'DRY-EDEN-165',
        catIdx: 4,
        price: '85.00',
        unit: 'block',
        vatRate: '12.00',
      },
      {
        name: 'CDO Chicken Franks 500g',
        sku: 'FRZ-CDOF-500',
        catIdx: 5,
        price: '125.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Purefoods Hotdog Jumbo 1kg',
        sku: 'FRZ-PFHJ-1K',
        catIdx: 5,
        price: '215.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Magnolia Ice Cream 1.3L',
        sku: 'FRZ-MGIC-1300',
        catIdx: 5,
        price: '180.00',
        unit: 'tub',
        vatRate: '12.00',
      },
      {
        name: 'Silver Swan Soy Sauce 1L',
        sku: 'CND-SWSS-1L',
        catIdx: 6,
        price: '55.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'UFC Banana Ketchup 320g',
        sku: 'CND-UFBK-320',
        catIdx: 6,
        price: '42.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'Datu Puti Vinegar 1L',
        sku: 'CND-DPVN-1L',
        catIdx: 6,
        price: '38.00',
        unit: 'bottle',
        vatRate: '12.00',
      },
      {
        name: 'Maggi Magic Sarap 100g',
        sku: 'CND-MGMS-100',
        catIdx: 6,
        price: '65.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Sinandomeng Rice 5kg',
        sku: 'RCE-SNDM-5K',
        catIdx: 7,
        price: '250.00',
        unit: 'sack',
        vatRate: '0.00',
        vatType: VatType.VAT_EXEMPT,
      },
      {
        name: 'Jasmine Rice 25kg',
        sku: 'RCE-JSMN-25K',
        catIdx: 7,
        price: '1350.00',
        unit: 'sack',
        vatRate: '0.00',
        vatType: VatType.VAT_EXEMPT,
      },
      {
        name: 'Lucky Me Pancit Canton 60g (6-pack)',
        sku: 'RCE-LMPC-6P',
        catIdx: 7,
        price: '72.00',
        unit: 'pack',
        vatRate: '12.00',
      },
      {
        name: 'Nissin Cup Noodles 40g',
        sku: 'RCE-NSCN-40',
        catIdx: 7,
        price: '22.00',
        unit: 'cup',
        vatRate: '12.00',
      },
    ];

    const products: Product[] = [];
    for (const p of productsData) {
      products.push(
        await productRepo.save(
          productRepo.create({
            name: p.name,
            sku: p.sku,
            categoryId: categories[p.catIdx].id,
            unitPrice: p.price,
            unit: p.unit,
            vatType: (p as any).vatType ?? VatType.VATABLE,
            vatRate: p.vatRate,
            tenantId: T,
          }),
        ),
      );
    }
    this.logger.log(`Products: ${products.length} created`);

    // ─── Stock Levels ────────────────────────────────────────────────────────
    for (const product of products) {
      await stockLevelRepo.save(
        stockLevelRepo.create({
          storeId: store.id,
          productId: product.id,
          currentQuantity: Math.floor(Math.random() * 100) + 20,
          reorderThreshold: 10,
          criticalThreshold: 3,
          tenantId: T,
        }),
      );
    }

    // ─── Tax Config ──────────────────────────────────────────────────────────
    await taxConfigRepo.save(
      taxConfigRepo.create({
        storeId: store.id,
        vatRate: '12.0000',
        birMinNumber: 'MIN-2026-000001',
        birPtuNumber: 'PTU-2026-000001',
        nextOrNumber: 1,
        nextSiNumber: 1,
        tenantId: T,
      }),
    );

    // ─── Customers ───────────────────────────────────────────────────────────
    for (const c of [
      {
        firstName: 'Ana',
        lastName: 'Cruz',
        email: 'ana.cruz@email.com',
        phone: '+63-917-333-0001',
      },
      {
        firstName: 'Roberto',
        lastName: 'Lim',
        email: 'roberto.lim@email.com',
        phone: '+63-917-333-0002',
      },
      {
        firstName: 'Carmen',
        lastName: 'Tan',
        email: 'carmen.tan@email.com',
        phone: '+63-917-333-0003',
      },
    ]) {
      await customerRepo.save(customerRepo.create({ ...c, tenantId: T }));
    }

    // ─── Discounts ───────────────────────────────────────────────────────────
    for (const d of [
      { name: 'Senior Citizen (20%)', type: DiscountType.SC, value: '20.00' },
      { name: 'PWD (20%)', type: DiscountType.PWD, value: '20.00' },
      {
        name: 'Employee Discount (10%)',
        type: DiscountType.PERCENTAGE,
        value: '10.00',
      },
    ]) {
      await discountRepo.save(
        discountRepo.create({ ...d, isActive: true, tenantId: T }),
      );
    }

    // ─── Suppliers ───────────────────────────────────────────────────────────
    for (const s of [
      {
        name: 'Universal Robina Corporation',
        contactPerson: 'Mark Angeles',
        contactPhone: '+63-2-8555-0001',
      },
      {
        name: 'Nestle Philippines',
        contactPerson: 'Sarah Mendoza',
        contactPhone: '+63-2-8555-0002',
      },
      {
        name: 'CDO Foodsphere',
        contactPerson: 'Grace Villanueva',
        contactPhone: '+63-2-8555-0004',
      },
    ]) {
      await supplierRepo.save(supplierRepo.create({ ...s, tenantId: T }));
    }

    this.logger.log('Seed complete!');
    this.logger.log('Login credentials:');
    for (const u of usersData) {
      this.logger.log(`  ${u.role.padEnd(20)} ${u.email} / ${u.password}`);
    }
  }
}
