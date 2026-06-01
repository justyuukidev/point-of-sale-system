import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
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
import * as bcrypt from 'bcrypt';

const DEMO_PASSWORDS: Record<string, string> = {
  'admin@jssi-demo.ph': 'Admin123!',
  'manager@jssi-demo.ph': 'Manager123!',
  'cashier@jssi-demo.ph': 'Cashier123!',
  'warehouse@jssi-demo.ph': 'Warehouse123!',
};

const DEMO_CASHIER_PIN = '1234';
const PIN_HASH_ROUNDS = 10;

async function syncFirebaseUsersForExistingTenant(
  dataSource: DataSource,
  firebaseService: FirebaseService,
  tenantId: number,
) {
  const userRepo = dataSource.getRepository(User);
  const users = await userRepo.find({ where: { tenantId } });

  console.log('ℹ️  Database is already seeded. Syncing Firebase emulator users...');

  for (const user of users) {
    let firebaseUser;
    try {
      firebaseUser = await firebaseService.auth.getUserByEmail(user.email);
    } catch {
      const password = DEMO_PASSWORDS[user.email] ?? 'Test123!';
      firebaseUser = await firebaseService.auth.createUser({
        email: user.email,
        password,
        displayName: `${user.firstName} ${user.lastName}`,
      });
      console.log(`  Re-created Firebase user: ${user.email}`);
    }

    if (firebaseUser.uid !== user.firebaseUid) {
      await userRepo.update(user.id, { firebaseUid: firebaseUser.uid });
      console.log(`  Updated firebaseUid for ${user.email}`);
    }

    await firebaseService.auth.setCustomUserClaims(firebaseUser.uid, {
      role: user.role,
      tenantId,
    });
  }

  console.log('✅ Firebase emulator users synced.');
}

async function ensureDemoCashierPin(dataSource: DataSource, tenantId: number) {
  const userRepo = dataSource.getRepository(User);
  const cashier = await userRepo.findOne({
    where: {
      tenantId,
      email: 'cashier@jssi-demo.ph',
    },
  });

  if (!cashier || cashier.pinHash) return;

  cashier.pinHash = await bcrypt.hash(DEMO_CASHIER_PIN, PIN_HASH_ROUNDS);
  await userRepo.save(cashier);
  console.log(`✅ Default cashier PIN set for ${cashier.email}: ${DEMO_CASHIER_PIN}`);
}

/**
 * Database seed script — creates test data for development.
 * Idempotent: checks if seed tenant exists before creating.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 * Or:  npx nest start -- --entryFile database/seed
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const firebaseService = app.get(FirebaseService);

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);
  const storeRepo = dataSource.getRepository(Store);
  const warehouseRepo = dataSource.getRepository(Warehouse);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const stockLevelRepo = dataSource.getRepository(StockLevel);
  const taxConfigRepo = dataSource.getRepository(TaxConfig);
  const customerRepo = dataSource.getRepository(Customer);
  const discountRepo = dataSource.getRepository(Discount);
  const supplierRepo = dataSource.getRepository(Supplier);

  // Check if already seeded
  const existingTenant = await tenantRepo.findOne({
    where: { tin: '000-000-000-000' },
  });
  if (existingTenant) {
    if (process.env['FIREBASE_AUTH_EMULATOR_HOST']) {
      await syncFirebaseUsersForExistingTenant(
        dataSource,
        firebaseService,
        existingTenant.id,
      );
    } else {
      console.log('✅ Database already seeded (tenant exists). Skipping data creation.');
    }

    await ensureDemoCashierPin(dataSource, existingTenant.id);

    console.log('\n📋 Demo login credentials:');
    for (const [email, password] of Object.entries(DEMO_PASSWORDS)) {
      console.log(`   ${email} / ${password}`);
    }
    console.log(`\n🔐 Demo cashier PIN: ${DEMO_CASHIER_PIN}`);
    await app.close();
    return;
  }

  console.log('🌱 Seeding database...');

  // ─── Tenant ────────────────────────────────────────────────────────────────

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
      tenantId: 0, // placeholder, will self-reference
    }),
  );
  // Self-reference tenantId
  tenant.tenantId = tenant.id;
  await tenantRepo.save(tenant);
  const T = tenant.id;

  console.log(`  Tenant: ${tenant.businessName} (id=${T})`);

  // ─── Firebase Users + DB Users ─────────────────────────────────────────────

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
    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await firebaseService.auth.createUser({
        email: u.email,
        password: u.password,
        displayName: `${u.firstName} ${u.lastName}`,
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/email-already-exists') {
        firebaseUser = await firebaseService.auth.getUserByEmail(u.email);
      } else {
        throw err;
      }
    }

    // Set custom claims
    await firebaseService.auth.setCustomUserClaims(firebaseUser.uid, {
      role: u.role,
      tenantId: T,
    });

    // Create DB user
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
    console.log(`  User: ${u.email} (${u.role}, id=${dbUser.id})`);
  }

  const cashierUser = dbUsers.find((user) => user.email === 'cashier@jssi-demo.ph');
  if (cashierUser) {
    cashierUser.pinHash = await bcrypt.hash(DEMO_CASHIER_PIN, PIN_HASH_ROUNDS);
    await userRepo.save(cashierUser);
    console.log(`  Default cashier PIN set: ${DEMO_CASHIER_PIN}`);
  }

  // ─── Store ─────────────────────────────────────────────────────────────────

  const store = await storeRepo.save(
    storeRepo.create({
      name: 'JSSI Main Branch',
      address: '456 Retail Avenue, Makati City',
      contactPhone: '+63-917-111-1111',
      tenantId: T,
    }),
  );
  console.log(`  Store: ${store.name} (id=${store.id})`);

  // Assign store manager + cashier to the store
  dbUsers[1].storeId = store.id;
  dbUsers[2].storeId = store.id;
  await userRepo.save(dbUsers[1]);
  await userRepo.save(dbUsers[2]);

  // ─── Warehouse ─────────────────────────────────────────────────────────────

  const warehouse = await warehouseRepo.save(
    warehouseRepo.create({
      name: 'JSSI Central Commissary',
      address: '789 Industrial Park, Pasig City',
      contactPhone: '+63-917-222-2222',
      tenantId: T,
    }),
  );
  console.log(`  Warehouse: ${warehouse.name} (id=${warehouse.id})`);

  // Assign warehouse manager
  dbUsers[3].warehouseId = warehouse.id;
  await userRepo.save(dbUsers[3]);

  // ─── Categories ────────────────────────────────────────────────────────────

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
    const cat = await categoryRepo.save(
      categoryRepo.create({ name, tenantId: T }),
    );
    categories.push(cat);
  }
  console.log(`  Categories: ${categories.length} created`);

  // ─── Products (30+ SKUs) ───────────────────────────────────────────────────

  const productsData = [
    // Beverages
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
    // Snacks
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
    // Canned Goods
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
    // Personal Care
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
    // Dairy
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
    // Frozen
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
    // Condiments
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
    // Rice & Grains
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
    {
      name: 'Argentina Meatloaf 170g',
      sku: 'CAN-ARML-170',
      catIdx: 2,
      price: '38.00',
      unit: 'can',
      vatRate: '12.00',
    },
  ];

  const products: Product[] = [];
  for (const p of productsData) {
    const product = await productRepo.save(
      productRepo.create({
        name: p.name,
        sku: p.sku,
        categoryId: categories[p.catIdx].id,
        unitPrice: p.price,
        unit: p.unit,
        vatType: p.vatType ?? VatType.VATABLE,
        vatRate: p.vatRate,
        tenantId: T,
      }),
    );
    products.push(product);
  }
  console.log(`  Products: ${products.length} created`);

  // ─── Stock Levels ──────────────────────────────────────────────────────────

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
  console.log(
    `  Stock Levels: ${products.length} created (store: ${store.name})`,
  );

  // ─── Tax Config ────────────────────────────────────────────────────────────

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
  console.log('  Tax Config: Standard VAT (12%) for store');

  // ─── Customers ─────────────────────────────────────────────────────────────

  const customersData = [
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
  ];

  for (const c of customersData) {
    await customerRepo.save(
      customerRepo.create({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        tenantId: T,
      }),
    );
  }
  console.log(`  Customers: ${customersData.length} created`);

  // ─── Discounts ─────────────────────────────────────────────────────────────

  const discountsData = [
    { name: 'Senior Citizen (20%)', type: DiscountType.SC, value: '20.00' },
    { name: 'PWD (20%)', type: DiscountType.PWD, value: '20.00' },
    {
      name: 'Employee Discount (10%)',
      type: DiscountType.PERCENTAGE,
      value: '10.00',
    },
    {
      name: 'Holiday Sale (15%)',
      type: DiscountType.PERCENTAGE,
      value: '15.00',
    },
  ];

  for (const d of discountsData) {
    await discountRepo.save(
      discountRepo.create({
        name: d.name,
        type: d.type,
        value: d.value,
        isActive: true,
        tenantId: T,
      }),
    );
  }
  console.log(`  Discounts: ${discountsData.length} created`);

  // ─── Suppliers ─────────────────────────────────────────────────────────────

  const suppliersData = [
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
      name: 'Procter & Gamble PH',
      contactPerson: 'Daniel Ramos',
      contactPhone: '+63-2-8555-0003',
    },
    {
      name: 'CDO Foodsphere',
      contactPerson: 'Grace Villanueva',
      contactPhone: '+63-2-8555-0004',
    },
  ];

  for (const s of suppliersData) {
    await supplierRepo.save(
      supplierRepo.create({
        name: s.name,
        contactPerson: s.contactPerson,
        contactPhone: s.contactPhone,
        tenantId: T,
      }),
    );
  }
  console.log(`  Suppliers: ${suppliersData.length} created`);

  // ─── Done ──────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login credentials:');
  for (const u of usersData) {
    console.log(`   ${u.role.padEnd(20)} ${u.email} / ${u.password}`);
  }
  console.log(`\n🔐 Default cashier PIN: ${DEMO_CASHIER_PIN}`);

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
