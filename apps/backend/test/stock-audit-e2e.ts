/**
 * E2E Stock Audit Test Script (Tier 12)
 *
 * Tests StockMovement CRUD (append-only audit log)
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

async function getAuthToken(
  role = 'TENANT_ADMIN',
  extra: Record<string, unknown> = {},
): Promise<string> {
  const email = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
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
        customAttributes: JSON.stringify({
          role,
          tenantId: 1,
          userId: 1,
          operatorId: 1,
          ...extra,
        }),
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
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json')
    ? await res.json()
    : await res.text();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
    return;
  }
  console.log(`✅ PASS: ${message}`);
  passed++;
}

async function main() {
  console.log('\n📦 JSSI POS — Stock Audit E2E Test (Tier 12)\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  // Setup: create store, category, product
  const storeRes = await api('POST', '/stores', token, {
    name: `Audit Store ${Date.now()}`,
    address: '123 St',
    contactPhone: '+63-917-555-9999',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  const catRes = await api('POST', '/categories', token, {
    name: `Cat ${Date.now()}`,
  });
  assert(catRes.status === 201, 'Created category');

  const prodRes = await api('POST', '/products', token, {
    name: `Product ${Date.now()}`,
    sku: `SKU-AUDIT-${Date.now()}`,
    categoryId: catRes.data.id,
    unitPrice: '100.00',
    unit: 'pc',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  assert(prodRes.status === 201, 'Created product');
  const productId = prodRes.data.id;

  // Create initial stock via stock-levels
  const slRes = await api('POST', '/stock-levels', token, {
    storeId,
    productId,
    currentQuantity: 100,
  });
  assert(slRes.status === 201, 'Created initial stock level (100)');

  console.log('\n--- Manual Adjustment (positive) ---');
  const adj1 = await api('POST', '/stock-movements', token, {
    storeId,
    productId,
    movementType: 'ADJUSTMENT',
    quantityChange: 10,
    notes: 'Physical count correction +10',
  });
  assert(adj1.status === 201, 'Created positive adjustment');
  assert(adj1.data.quantityBefore === 100, 'Quantity before = 100');
  assert(adj1.data.quantityAfter === 110, 'Quantity after = 110');
  assert(adj1.data.movementType === 'ADJUSTMENT', 'Movement type = ADJUSTMENT');
  assert(adj1.data.notes === 'Physical count correction +10', 'Notes saved');
  assert(!!adj1.data.uuid, 'Has UUID');

  // Verify stock level updated
  const sl1 = await api('GET', `/stock-levels?productId=${productId}`, token);
  const sl1Val = sl1.data.find((s: any) => s.storeId === storeId);
  assert(sl1Val.currentQuantity === 110, 'Stock level updated to 110');

  console.log('\n--- Manual Adjustment (negative) ---');
  const adj2 = await api('POST', '/stock-movements', token, {
    storeId,
    productId,
    movementType: 'ADJUSTMENT',
    quantityChange: -5,
    notes: 'Damaged goods removed',
  });
  assert(adj2.status === 201, 'Created negative adjustment');
  assert(adj2.data.quantityBefore === 110, 'Quantity before = 110');
  assert(adj2.data.quantityAfter === 105, 'Quantity after = 105');

  // Verify stock level updated
  const sl2 = await api('GET', `/stock-levels?productId=${productId}`, token);
  const sl2Val = sl2.data.find((s: any) => s.storeId === storeId);
  assert(sl2Val.currentQuantity === 105, 'Stock level updated to 105');

  console.log('\n--- Insufficient Stock ---');
  const adjFail = await api('POST', '/stock-movements', token, {
    storeId,
    productId,
    movementType: 'ADJUSTMENT',
    quantityChange: -200,
    notes: 'Should fail',
  });
  assert(adjFail.status === 400, 'Rejected: insufficient stock');

  console.log('\n--- Query Movements ---');
  const all = await api('GET', '/stock-movements', token);
  assert(all.status === 200, 'List all movements');
  assert(Array.isArray(all.data.data), 'Returns paginated data array');
  assert(all.data.data.length >= 2, 'Has at least 2 movements');

  // By store
  const byStore = await api(
    'GET',
    `/stock-movements?storeId=${storeId}`,
    token,
  );
  assert(byStore.status === 200, 'Filter by storeId');
  assert(byStore.data.data.length >= 2, 'Has movements for store');

  // By product
  const byProduct = await api(
    'GET',
    `/stock-movements?productId=${productId}`,
    token,
  );
  assert(byProduct.status === 200, 'Filter by productId');
  assert(byProduct.data.data.length >= 2, 'Has movements for product');

  // By type
  const byType = await api(
    'GET',
    `/stock-movements?movementType=ADJUSTMENT`,
    token,
  );
  assert(byType.status === 200, 'Filter by movementType');
  assert(byType.data.data.length >= 2, 'Has ADJUSTMENT movements');

  // Get by UUID
  const movementUuid = adj1.data.uuid;
  const byUuid = await api('GET', `/stock-movements/${movementUuid}`, token);
  assert(byUuid.status === 200, 'Get by UUID');
  assert(byUuid.data.uuid === movementUuid, 'UUID matches');
  assert(byUuid.data.quantityChange === 10, 'Quantity change correct');

  // Not found
  const notFound = await api(
    'GET',
    '/stock-movements/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFound.status === 404, 'Movement not found returns 404');

  console.log('\n--- Movement with reference IDs ---');
  const refMove = await api('POST', '/stock-movements', token, {
    storeId,
    productId,
    movementType: 'SALE',
    quantityChange: -3,
    transactionId: 999,
    notes: 'Simulated sale reference',
  });
  assert(refMove.status === 201, 'Created SALE movement with transactionId');
  assert(refMove.data.transactionId === 999, 'transactionId saved');
  assert(refMove.data.movementType === 'SALE', 'Type is SALE');
  assert(refMove.data.quantityAfter === 102, 'Stock after sale = 102');

  console.log('\n--- Role-Based Access ---');
  const cashierToken = await getAuthToken('CASHIER', { userId: 2 });

  // Cashier can read
  const cashierRead = await api('GET', '/stock-movements', cashierToken);
  assert(cashierRead.status === 200, 'Cashier can list movements');

  // Cashier cannot create
  const cashierCreate = await api('POST', '/stock-movements', cashierToken, {
    storeId,
    productId,
    movementType: 'ADJUSTMENT',
    quantityChange: 1,
  });
  assert(cashierCreate.status === 403, 'Cashier cannot create movements');

  // Store manager can create
  const managerToken = await getAuthToken('STORE_MANAGER', { userId: 3 });
  const managerCreate = await api('POST', '/stock-movements', managerToken, {
    storeId,
    productId,
    movementType: 'ADJUSTMENT',
    quantityChange: 2,
    notes: 'Manager adjustment',
  });
  assert(managerCreate.status === 201, 'Store manager can create movements');

  console.log('\n--- No Update/Delete (Append-Only) ---');
  // Verify no PATCH/DELETE endpoints exist
  const patchRes = await fetch(`${API_BASE}/stock-movements/${movementUuid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes: 'hacked' }),
  });
  assert(patchRes.status === 404, 'No PATCH endpoint (append-only)');

  const deleteRes = await fetch(`${API_BASE}/stock-movements/${movementUuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(deleteRes.status === 404, 'No DELETE endpoint (append-only)');

  console.log('\n══════════════════════════════════════════════════');
  console.log(`📦 Stock Audit E2E Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
