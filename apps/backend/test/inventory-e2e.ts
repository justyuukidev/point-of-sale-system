/**
 * E2E Inventory Test Script
 *
 * Tests Category, Product, and StockLevel CRUD
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

async function getAuthToken(): Promise<string> {
  const email = `admin-${Date.now()}@test.com`;
  const password = 'TestPass123!';

  const signUp = (await fetch(
    `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  ).then((r) => r.json())) as { localId: string };

  await fetch(
    `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer owner',
      },
      body: JSON.stringify({
        localId: signUp.localId,
        customAttributes: JSON.stringify({ role: 'TENANT_ADMIN', tenantId: 1 }),
      }),
    },
  );

  const signIn = (await fetch(
    `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  ).then((r) => r.json())) as { idToken: string };

  return signIn.idToken;
}

async function api(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json')
    ? await res.json()
    : await res.text();
  return { status: res.status, data };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function main() {
  console.log('\n📦 JSSI POS — Inventory E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');
  const runId = Date.now();
  const primarySku = `BEV-COKE-${runId}`;
  const secondarySku = `SNK-CHIPPY-${runId}`;

  // === CATEGORY CRUD ===
  console.log('\n--- Category CRUD ---');

  const createCat = await api('POST', '/categories', token, {
    name: 'Beverages',
    description: 'Drinks and liquid refreshments',
    sortOrder: 1,
  });
  assert(createCat.status === 201, 'POST /categories returns 201');
  const cat = createCat.data;
  assert(cat.name === 'Beverages', 'Category name matches');
  assert(cat.sortOrder === 1, 'Category sortOrder matches');
  console.log('  Created:', cat.uuid);

  const createCat2 = await api('POST', '/categories', token, {
    name: 'Snacks',
    sortOrder: 2,
  });
  assert(createCat2.status === 201, 'POST /categories (2nd) returns 201');

  const allCats = await api('GET', '/categories', token);
  assert(allCats.status === 200, 'GET /categories returns 200');
  assert(
    Array.isArray(allCats.data) && allCats.data.length >= 2,
    'Returns array with 2+ items',
  );
  // Should be sorted by sortOrder
  assert(
    allCats.data[0].sortOrder <= allCats.data[1].sortOrder,
    'Categories sorted by sortOrder',
  );

  const getCat = await api('GET', `/categories/${cat.uuid}`, token);
  assert(getCat.status === 200, 'GET /categories/:uuid returns 200');

  const updateCat = await api('PATCH', `/categories/${cat.uuid}`, token, {
    name: 'Beverages & Drinks',
  });
  assert(updateCat.status === 200, 'PATCH /categories/:uuid returns 200');
  assert(updateCat.data.name === 'Beverages & Drinks', 'Name updated');

  // === PRODUCT CRUD ===
  console.log('\n--- Product CRUD ---');

  const createProd = await api('POST', '/products', token, {
    categoryId: cat.id,
    name: 'Coca-Cola 330ml',
    sku: primarySku,
    barcode: `490${runId}`,
    unitPrice: '35.0000',
    unit: 'piece',
    vatType: 'VATABLE',
    vatRate: '0.1200',
    expiryWarningDays: 30,
  });
  assert(createProd.status === 201, 'POST /products returns 201');
  const prod = createProd.data;
  assert(prod.name === 'Coca-Cola 330ml', 'Product name matches');
  assert(prod.sku === primarySku, 'Product SKU matches');
  assert(prod.unitPrice === '35.0000', 'Product unitPrice is string (decimal)');
  assert(prod.vatType === 'VATABLE', 'Product vatType matches');
  console.log('  Created:', prod.uuid);

  // Duplicate SKU should fail
  const dupSku = await api('POST', '/products', token, {
    categoryId: cat.id,
    name: 'Another Coke',
    sku: primarySku,
    unitPrice: '40.0000',
    unit: 'piece',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  assert(dupSku.status === 409, 'Duplicate SKU returns 409 Conflict');

  // Create another product
  const createProd2 = await api('POST', '/products', token, {
    categoryId: createCat2.data.id,
    name: 'Chippy BBQ',
    sku: secondarySku,
    unitPrice: '12.5000',
    unit: 'piece',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  assert(createProd2.status === 201, 'POST /products (2nd) returns 201');

  const allProds = await api('GET', '/products', token);
  assert(allProds.status === 200, 'GET /products returns 200');
  assert(
    Array.isArray(allProds.data.data) && allProds.data.data.length >= 2,
    'Returns 2+ products',
  );

  // Filter by category
  const catProds = await api('GET', `/products?categoryId=${cat.id}`, token);
  assert(catProds.status === 200, 'GET /products?categoryId returns 200');
  assert(
    catProds.data.every((p: any) => p.categoryId === cat.id),
    'All filtered by category',
  );

  const getProd = await api('GET', `/products/${prod.uuid}`, token);
  assert(getProd.status === 200, 'GET /products/:uuid returns 200');

  const updateProd = await api('PATCH', `/products/${prod.uuid}`, token, {
    unitPrice: '38.0000',
    isActive: false,
  });
  assert(updateProd.status === 200, 'PATCH /products/:uuid returns 200');
  assert(updateProd.data.unitPrice === '38.0000', 'Price updated');
  assert(updateProd.data.isActive === false, 'isActive set to false');

  // === STOCK LEVEL CRUD ===
  console.log('\n--- StockLevel CRUD ---');

  // First create a store to use
  const store = await api('POST', '/stores', token, {
    name: 'Test Store for Stock',
    address: '123 Stock St',
    contactPhone: '+63-917-000-0001',
  });
  const storeId = store.data.id;

  const createSL = await api('POST', '/stock-levels', token, {
    storeId,
    productId: prod.id,
    currentQuantity: 100,
    reorderThreshold: 20,
    criticalThreshold: 5,
  });
  assert(createSL.status === 201, 'POST /stock-levels returns 201');
  const sl = createSL.data;
  assert(sl.currentQuantity === 100, 'StockLevel quantity matches');
  assert(sl.reorderThreshold === 20, 'Reorder threshold matches');
  console.log('  Created:', sl.uuid);

  // Duplicate store+product should fail
  const dupSL = await api('POST', '/stock-levels', token, {
    storeId,
    productId: prod.id,
  });
  assert(
    dupSL.status === 409,
    'Duplicate store/product stock level returns 409',
  );

  const getSL = await api('GET', `/stock-levels/${sl.uuid}`, token);
  assert(getSL.status === 200, 'GET /stock-levels/:uuid returns 200');

  const byStore = await api('GET', `/stock-levels?storeId=${storeId}`, token);
  assert(byStore.status === 200, 'GET /stock-levels?storeId returns 200');
  assert(Array.isArray(byStore.data), 'Returns array');

  const updateSL = await api('PATCH', `/stock-levels/${sl.uuid}`, token, {
    currentQuantity: 85,
  });
  assert(updateSL.status === 200, 'PATCH /stock-levels/:uuid returns 200');
  assert(updateSL.data.currentQuantity === 85, 'Quantity updated');

  const deleteSL = await api('DELETE', `/stock-levels/${sl.uuid}`, token);
  assert(deleteSL.status === 200, 'DELETE /stock-levels/:uuid returns 200');

  // === VALIDATION ===
  console.log('\n--- Validation ---');

  const badProd = await api('POST', '/products', token, {
    name: 'No SKU Product',
    // Missing required fields
  });
  assert(
    badProd.status === 400,
    'POST /products with missing fields returns 400',
  );

  const badCat = await api('POST', '/categories', token, {});
  assert(badCat.status === 400, 'POST /categories with empty body returns 400');

  // === SOFT DELETE ===
  console.log('\n--- Soft delete ---');

  const deleteProd = await api('DELETE', `/products/${prod.uuid}`, token);
  assert(deleteProd.status === 200, 'DELETE /products/:uuid returns 200');

  const afterDel = await api('GET', '/products', token);
  const afterDelProducts = Array.isArray(afterDel.data)
    ? afterDel.data
    : afterDel.data.data;
  assert(
    Array.isArray(afterDelProducts),
    'GET /products returns product list payload',
  );
  assert(
    !afterDelProducts.some((p: any) => p.uuid === prod.uuid),
    'Deleted product not in list',
  );

  const deleteCat = await api('DELETE', `/categories/${cat.uuid}`, token);
  assert(deleteCat.status === 200, 'DELETE /categories/:uuid returns 200');

  console.log('\n🎉 All Inventory tests passed!\n');
}

main().catch((err) => {
  console.error('\n💀 Test failed:', err.message);
  process.exit(1);
});
