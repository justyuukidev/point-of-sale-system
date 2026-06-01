/**
 * E2E Customer & Discount Test Script
 *
 * Tests Customer and Discount CRUD operations
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

async function getAuthToken(role = 'TENANT_ADMIN'): Promise<string> {
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
        customAttributes: JSON.stringify({ role, tenantId: 1 }),
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
  console.log('\n👤🏷️  JSSI POS — Customer & Discount E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  // ================================================================
  // CUSTOMER CRUD
  // ================================================================
  console.log('\n--- Customer CRUD ---');

  const createCust = await api('POST', '/customers', token, {
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    phone: '+63-917-555-0100',
    discountType: 'SC',
    idNumber: 'SC-0001234',
    dateOfBirth: '1960-03-15',
    tin: '123-456-789-000',
    address: '123 Rizal St, Manila',
  });
  assert(createCust.status === 201, 'POST /customers returns 201');
  const cust = createCust.data;
  assert(cust.firstName === 'Juan', 'Customer firstName matches');
  assert(cust.lastName === 'Dela Cruz', 'Customer lastName matches');
  assert(cust.discountType === 'SC', 'Customer discountType matches');
  assert(cust.email === 'juan@example.com', 'Customer email matches');
  assert(cust.tenantId === 1, 'Customer tenantId matches claim');
  console.log('  Created:', cust.uuid);

  // Create 2nd customer
  const createCust2 = await api('POST', '/customers', token, {
    firstName: 'Maria',
    lastName: 'Santos',
    discountType: 'PWD',
    idNumber: 'PWD-0005678',
  });
  assert(createCust2.status === 201, 'POST /customers (2nd) returns 201');

  // List
  const listCust = await api('GET', '/customers', token);
  assert(listCust.status === 200, 'GET /customers returns 200');
  const customers = Array.isArray(listCust.data)
    ? listCust.data
    : listCust.data.data;
  assert(Array.isArray(customers), 'Returns customer list payload');
  assert(customers.length >= 2, 'Has at least 2 customers');

  // Check ordering (lastName ASC)
  const names = customers.map((c: any) => c.lastName);
  const sorted = [...names].sort();
  assert(
    JSON.stringify(names) === JSON.stringify(sorted),
    'Customers sorted by lastName',
  );

  // Get by UUID
  const getCust = await api('GET', `/customers/${cust.uuid}`, token);
  assert(getCust.status === 200, 'GET /customers/:uuid returns 200');
  assert(getCust.data.uuid === cust.uuid, 'UUID matches');

  // Update
  const patchCust = await api('PATCH', `/customers/${cust.uuid}`, token, {
    phone: '+63-917-555-0199',
    isActive: false,
  });
  assert(patchCust.status === 200, 'PATCH /customers/:uuid returns 200');
  assert(patchCust.data.phone === '+63-917-555-0199', 'Phone updated');
  assert(patchCust.data.isActive === false, 'isActive set to false');

  // Delete
  const delCust = await api(
    'DELETE',
    `/customers/${createCust2.data.uuid}`,
    token,
  );
  assert(delCust.status === 200, 'DELETE /customers/:uuid returns 200');

  // Verify soft delete
  const listAfterDel = await api('GET', '/customers', token);
  const customersAfterDelete = Array.isArray(listAfterDel.data)
    ? listAfterDel.data
    : listAfterDel.data.data;
  const found = customersAfterDelete.find(
    (c: any) => c.uuid === createCust2.data.uuid,
  );
  assert(!found, 'Soft-deleted customer not in list');

  // ================================================================
  // DISCOUNT CRUD
  // ================================================================
  console.log('\n--- Discount CRUD ---');

  const createDisc = await api('POST', '/discounts', token, {
    name: 'Senior Citizen 20%',
    type: 'SC',
    value: '20.0000',
    requiresCustomer: true,
    isActive: true,
    isStackable: false,
  });
  assert(createDisc.status === 201, 'POST /discounts returns 201');
  const disc = createDisc.data;
  assert(disc.name === 'Senior Citizen 20%', 'Discount name matches');
  assert(disc.type === 'SC', 'Discount type matches');
  assert(disc.value === '20.0000', 'Discount value matches');
  assert(disc.requiresCustomer === true, 'requiresCustomer matches');
  assert(disc.tenantId === 1, 'Discount tenantId matches claim');
  console.log('  Created:', disc.uuid);

  // Create 2nd discount
  const createDisc2 = await api('POST', '/discounts', token, {
    name: 'Holiday Sale 10%',
    type: 'PERCENTAGE',
    value: '10.0000',
    minPurchase: '500.0000',
    validFrom: '2026-12-20',
    validTo: '2026-12-31',
    isStackable: true,
  });
  assert(createDisc2.status === 201, 'POST /discounts (2nd) returns 201');
  assert(createDisc2.data.minPurchase === '500.0000', 'minPurchase matches');
  assert(createDisc2.data.validFrom === '2026-12-20', 'validFrom matches');
  assert(createDisc2.data.validTo === '2026-12-31', 'validTo matches');

  // Create fixed amount discount
  const createDisc3 = await api('POST', '/discounts', token, {
    name: 'P50 Off Coupon',
    type: 'FIXED_AMOUNT',
    value: '50.0000',
    minPurchase: '200.0000',
  });
  assert(
    createDisc3.status === 201,
    'POST /discounts (fixed amount) returns 201',
  );

  // List
  const listDisc = await api('GET', '/discounts', token);
  assert(listDisc.status === 200, 'GET /discounts returns 200');
  const discounts = Array.isArray(listDisc.data)
    ? listDisc.data
    : listDisc.data.data;
  assert(Array.isArray(discounts), 'Returns discount list payload');
  assert(discounts.length >= 3, 'Has at least 3 discounts');

  // Check ordering (name ASC)
  const discNames = discounts.map((d: any) => d.name);
  const sortedNames = [...discNames].sort();
  assert(
    JSON.stringify(discNames) === JSON.stringify(sortedNames),
    'Discounts sorted by name',
  );

  // Get by UUID
  const getDisc = await api('GET', `/discounts/${disc.uuid}`, token);
  assert(getDisc.status === 200, 'GET /discounts/:uuid returns 200');
  assert(getDisc.data.uuid === disc.uuid, 'UUID matches');

  // Update
  const patchDisc = await api('PATCH', `/discounts/${disc.uuid}`, token, {
    value: '25.0000',
    isActive: false,
  });
  assert(patchDisc.status === 200, 'PATCH /discounts/:uuid returns 200');
  assert(patchDisc.data.value === '25.0000', 'Value updated');
  assert(patchDisc.data.isActive === false, 'isActive set to false');

  // Delete
  const delDisc = await api(
    'DELETE',
    `/discounts/${createDisc3.data.uuid}`,
    token,
  );
  assert(delDisc.status === 200, 'DELETE /discounts/:uuid returns 200');

  // Verify soft delete
  const listAfterDelDisc = await api('GET', '/discounts', token);
  const discountsAfterDelete = Array.isArray(listAfterDelDisc.data)
    ? listAfterDelDisc.data
    : listAfterDelDisc.data.data;
  const foundDisc = discountsAfterDelete.find(
    (d: any) => d.uuid === createDisc3.data.uuid,
  );
  assert(!foundDisc, 'Soft-deleted discount not in list');

  // ================================================================
  // VALIDATION
  // ================================================================
  console.log('\n--- Validation ---');

  const badCust = await api('POST', '/customers', token, {});
  assert(badCust.status === 400, 'POST /customers with empty body returns 400');

  const badDisc = await api('POST', '/discounts', token, {});
  assert(badDisc.status === 400, 'POST /discounts with empty body returns 400');

  const badDiscType = await api('POST', '/discounts', token, {
    name: 'Bad',
    type: 'INVALID_TYPE',
    value: '10',
  });
  assert(
    badDiscType.status === 400,
    'POST /discounts with invalid type returns 400',
  );

  // ================================================================
  // AUTH GUARD
  // ================================================================
  console.log('\n--- Auth guard ---');

  const noAuth = await fetch(`${API_BASE}/customers`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(noAuth.status === 401, 'GET /customers without token returns 401');

  const noAuthDisc = await fetch(`${API_BASE}/discounts`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(noAuthDisc.status === 401, 'GET /discounts without token returns 401');

  // ================================================================
  // ROLE-BASED ACCESS
  // ================================================================
  console.log('\n--- Role-based access ---');

  // Cashier can read/create customers but NOT discounts (only TENANT_ADMIN can create discounts)
  const cashierToken = await getAuthToken('CASHIER');
  const cashierCust = await api('POST', '/customers', cashierToken, {
    firstName: 'Test',
    lastName: 'Cashier Customer',
  });
  assert(cashierCust.status === 201, 'CASHIER can create customer');

  const cashierDiscRead = await api('GET', '/discounts', cashierToken);
  assert(cashierDiscRead.status === 200, 'CASHIER can read discounts');

  const cashierDiscCreate = await api('POST', '/discounts', cashierToken, {
    name: 'Should Fail',
    type: 'PERCENTAGE',
    value: '5.0000',
  });
  assert(
    cashierDiscCreate.status === 403,
    'CASHIER cannot create discount (403)',
  );

  console.log('\n🎉 All Customer & Discount tests passed!\n');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
