/**
 * E2E Store/Warehouse Test Script
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

  // Create user
  const signUp = (await fetch(
    `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  ).then((r) => r.json())) as { localId: string; idToken: string };

  // Set TENANT_ADMIN claims
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

  // Re-sign in to get token with claims
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

async function apiCall(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
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
  console.log('\n🏪 JSSI POS — Store/Warehouse E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  // === STORE CRUD ===
  console.log('\n--- Store CRUD ---');

  const createStore = await apiCall('POST', '/stores', token, {
    name: 'Main Branch',
    address: '456 Commercial Ave, Makati City',
    contactPhone: '+63-917-555-0001',
    birMinNumber: 'BIR-MIN-001',
  });
  assert(createStore.status === 201, 'POST /stores returns 201');
  const store = createStore.data as {
    uuid: string;
    name: string;
    tenantId: number;
  };
  assert(store.name === 'Main Branch', 'Store name matches');
  assert(store.tenantId === 1, 'Store tenantId matches claim');
  console.log('  Created:', JSON.stringify(store, null, 2));

  const allStores = await apiCall('GET', '/stores', token);
  assert(allStores.status === 200, 'GET /stores returns 200');
  const stores = Array.isArray(allStores.data)
    ? allStores.data
    : allStores.data.data;
  assert(Array.isArray(stores), 'Returns store list payload');

  const getStore = await apiCall('GET', `/stores/${store.uuid}`, token);
  assert(getStore.status === 200, 'GET /stores/:uuid returns 200');

  const updateStore = await apiCall('PATCH', `/stores/${store.uuid}`, token, {
    name: 'Main Branch (Flagship)',
  });
  assert(updateStore.status === 200, 'PATCH /stores/:uuid returns 200');
  assert(
    (updateStore.data as { name: string }).name === 'Main Branch (Flagship)',
    'Name updated',
  );

  const deleteStore = await apiCall('DELETE', `/stores/${store.uuid}`, token);
  assert(deleteStore.status === 200, 'DELETE /stores/:uuid returns 200');

  const afterDelete = await apiCall('GET', '/stores', token);
  const remaining = (
    Array.isArray(afterDelete.data) ? afterDelete.data : afterDelete.data.data
  ) as { uuid: string }[];
  assert(
    !remaining.some((s) => s.uuid === store.uuid),
    'Soft-deleted store not in list',
  );

  // === WAREHOUSE CRUD ===
  console.log('\n--- Warehouse CRUD ---');

  const createWh = await apiCall('POST', '/warehouses', token, {
    name: 'Central Warehouse',
    address: '789 Industrial Park, Taguig',
    contactPhone: '+63-917-555-0002',
  });
  assert(createWh.status === 201, 'POST /warehouses returns 201');
  const wh = createWh.data as { uuid: string; name: string; tenantId: number };
  assert(wh.name === 'Central Warehouse', 'Warehouse name matches');
  assert(wh.tenantId === 1, 'Warehouse tenantId matches claim');
  console.log('  Created:', JSON.stringify(wh, null, 2));

  const allWh = await apiCall('GET', '/warehouses', token);
  assert(allWh.status === 200, 'GET /warehouses returns 200');

  const getWh = await apiCall('GET', `/warehouses/${wh.uuid}`, token);
  assert(getWh.status === 200, 'GET /warehouses/:uuid returns 200');

  const updateWh = await apiCall('PATCH', `/warehouses/${wh.uuid}`, token, {
    name: 'Central Warehouse (Main)',
    isActive: false,
  });
  assert(updateWh.status === 200, 'PATCH /warehouses/:uuid returns 200');
  assert(
    (updateWh.data as { name: string }).name === 'Central Warehouse (Main)',
    'Name updated',
  );
  assert(
    (updateWh.data as { isActive: boolean }).isActive === false,
    'isActive set to false',
  );

  const deleteWh = await apiCall('DELETE', `/warehouses/${wh.uuid}`, token);
  assert(deleteWh.status === 200, 'DELETE /warehouses/:uuid returns 200');

  // === VALIDATION ===
  console.log('\n--- Validation ---');

  const badStore = await apiCall('POST', '/stores', token, { name: 'X' });
  assert(
    badStore.status === 400,
    'POST /stores with missing fields returns 400',
  );

  const badWh = await apiCall('POST', '/warehouses', token, {});
  assert(badWh.status === 400, 'POST /warehouses with empty body returns 400');

  // === AUTH GUARD ===
  console.log('\n--- Auth guard ---');
  const noAuth = await fetch(`${API_BASE}/stores`);
  assert(noAuth.status === 401, 'GET /stores without token returns 401');

  console.log('\n🎉 All Store/Warehouse tests passed!\n');
}

main().catch((err) => {
  console.error('\n💀 Test failed:', err.message);
  process.exit(1);
});
