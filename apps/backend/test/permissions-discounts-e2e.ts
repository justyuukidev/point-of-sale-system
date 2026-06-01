/**
 * E2E Permission & Discount Enhancement Test Script
 *
 * Tests:
 * - User permission CRUD (grant, revoke, set, list)
 * - Permission-based discount access
 * - Active discounts endpoint
 * - Promo history audit trail
 * - Discount application on transactions
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
  const email = `perm-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
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
  console.log('\n🔐 JSSI POS — Permission & Discount E2E Test\n');

  const adminToken = await getAuthToken('TENANT_ADMIN');
  assert(!!adminToken, 'Got admin token');

  const ts = Date.now();

  // ================================================================
  // USER PERMISSIONS CRUD
  // ================================================================
  console.log('\n--- User Permissions CRUD ---');

  const resetPerms = await api('PUT', '/users/1/permissions', adminToken, {
    permissions: [],
  });
  assert(resetPerms.status === 200, 'Reset user permissions baseline');

  // Grant a permission to user 1
  const grantRes = await api('POST', '/users/1/permissions', adminToken, {
    permission: 'MANAGE_DISCOUNTS',
  });
  assert(
    grantRes.status === 201,
    'POST /users/1/permissions grants permission',
  );
  assert(
    grantRes.data.permission === 'MANAGE_DISCOUNTS',
    'Permission value matches',
  );
  assert(grantRes.data.userId === 1, 'userId matches');

  // List permissions
  const listRes = await api('GET', '/users/1/permissions', adminToken);
  assert(listRes.status === 200, 'GET /users/1/permissions returns 200');
  const listPermissions = Array.isArray(listRes.data)
    ? listRes.data
    : listRes.data.data;
  assert(Array.isArray(listPermissions), 'Returns permissions list payload');
  const hasManageDisc = listPermissions.some(
    (p: any) => p.permission === 'MANAGE_DISCOUNTS',
  );
  assert(hasManageDisc, 'MANAGE_DISCOUNTS found in list');

  // Duplicate grant fails
  const dupGrant = await api('POST', '/users/1/permissions', adminToken, {
    permission: 'MANAGE_DISCOUNTS',
  });
  assert(dupGrant.status === 409, 'Duplicate grant returns 409');

  // Grant another permission
  const grant2 = await api('POST', '/users/1/permissions', adminToken, {
    permission: 'VOID_TRANSACTIONS',
  });
  assert(grant2.status === 201, 'Granted VOID_TRANSACTIONS');

  // Set all permissions (replaces existing)
  const setRes = await api('PUT', '/users/1/permissions', adminToken, {
    permissions: ['MANAGE_DISCOUNTS', 'VIEW_REPORTS', 'MANAGE_CUSTOMERS'],
  });
  assert(
    setRes.status === 200,
    'PUT /users/1/permissions sets all permissions',
  );
  assert(setRes.data.length === 3, 'Now has exactly 3 permissions');

  // Verify set worked
  const listAfterSet = await api('GET', '/users/1/permissions', adminToken);
  const permissionsAfterSet = Array.isArray(listAfterSet.data)
    ? listAfterSet.data
    : listAfterSet.data.data;
  assert(permissionsAfterSet.length === 3, 'List confirms 3 permissions');
  const permNames = permissionsAfterSet.map((p: any) => p.permission).sort();
  assert(
    permNames.includes('MANAGE_CUSTOMERS') &&
      permNames.includes('MANAGE_DISCOUNTS') &&
      permNames.includes('VIEW_REPORTS'),
    'Correct permissions set',
  );

  // Revoke a permission
  const revokeRes = await api(
    'DELETE',
    '/users/1/permissions/VIEW_REPORTS',
    adminToken,
  );
  assert(
    revokeRes.status === 200,
    'DELETE /users/1/permissions/VIEW_REPORTS works',
  );

  // Verify revoke
  const listAfterRevoke = await api('GET', '/users/1/permissions', adminToken);
  const permissionsAfterRevoke = Array.isArray(listAfterRevoke.data)
    ? listAfterRevoke.data
    : listAfterRevoke.data.data;
  assert(
    permissionsAfterRevoke.length === 2,
    'Now has 2 permissions after revoke',
  );

  // Revoke non-existent fails
  const badRevoke = await api(
    'DELETE',
    '/users/1/permissions/ACCESS_ADMIN_PANEL',
    adminToken,
  );
  assert(badRevoke.status === 404, 'Revoke non-existent returns 404');

  // Non-admin cannot manage permissions
  const managerToken = await getAuthToken('STORE_MANAGER', { userId: 2 });
  const managerGrant = await api('POST', '/users/1/permissions', managerToken, {
    permission: 'MANAGE_STOCK',
  });
  assert(
    managerGrant.status === 403,
    'STORE_MANAGER cannot manage permissions (403)',
  );

  // ================================================================
  // PERMISSION-BASED DISCOUNT ACCESS
  // ================================================================
  console.log('\n--- Permission-Based Discount Access ---');

  // STORE_MANAGER without MANAGE_DISCOUNTS cannot create discounts
  const managerNoPermToken = await getAuthToken('STORE_MANAGER', {
    userId: 99,
  });
  const noPermDiscount = await api('POST', '/discounts', managerNoPermToken, {
    name: `No Perm Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '5.0000',
  });
  assert(
    noPermDiscount.status === 403,
    'STORE_MANAGER without permission cannot create discount',
  );

  // STORE_MANAGER with MANAGE_DISCOUNTS can create
  // (userId=1 has MANAGE_DISCOUNTS from above)
  const managerWithPermToken = await getAuthToken('STORE_MANAGER', {
    userId: 1,
  });
  const permDiscount = await api('POST', '/discounts', managerWithPermToken, {
    name: `Manager Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '10.0000',
    isActive: true,
  });
  assert(
    permDiscount.status === 201,
    'STORE_MANAGER with MANAGE_DISCOUNTS can create discount',
  );

  // TENANT_ADMIN always bypasses permission check
  const adminDiscount = await api('POST', '/discounts', adminToken, {
    name: `Admin Disc ${ts}`,
    type: 'FIXED_AMOUNT',
    value: '50.0000',
    isActive: true,
  });
  assert(
    adminDiscount.status === 201,
    'TENANT_ADMIN always can create (bypasses permissions)',
  );

  // CASHIER can still list discounts (no permission needed for GET)
  const cashierToken = await getAuthToken('CASHIER', { userId: 3 });
  const cashierList = await api('GET', '/discounts', cashierToken);
  assert(cashierList.status === 200, 'CASHIER can list discounts');

  // ================================================================
  // ACTIVE DISCOUNTS ENDPOINT
  // ================================================================
  console.log('\n--- Active Discounts ---');

  // Create time-bounded discounts
  const futureDisc = await api('POST', '/discounts', adminToken, {
    name: `Future Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '15.0000',
    validFrom: '2099-01-01',
    validTo: '2099-12-31',
    isActive: true,
  });
  assert(futureDisc.status === 201, 'Created future discount');

  const expiredDisc = await api('POST', '/discounts', adminToken, {
    name: `Expired Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '20.0000',
    validFrom: '2020-01-01',
    validTo: '2020-12-31',
    isActive: true,
  });
  assert(expiredDisc.status === 201, 'Created expired discount');

  const inactiveDisc = await api('POST', '/discounts', adminToken, {
    name: `Inactive Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '25.0000',
    isActive: false,
  });
  assert(inactiveDisc.status === 201, 'Created inactive discount');

  const activeList = await api('GET', '/discounts/active', adminToken);
  assert(activeList.status === 200, 'GET /discounts/active returns 200');
  const activeDiscounts = Array.isArray(activeList.data)
    ? activeList.data
    : activeList.data.data;
  assert(
    Array.isArray(activeDiscounts),
    'Returns active discount list payload',
  );

  // Active list should include adminDiscount and permDiscount (no date restriction, isActive=true)
  const activeUuids = activeDiscounts.map((d: any) => d.uuid);
  assert(
    activeUuids.includes(adminDiscount.data.uuid),
    'Admin discount is in active list',
  );
  assert(
    activeUuids.includes(permDiscount.data.uuid),
    'Manager discount is in active list',
  );
  assert(
    !activeUuids.includes(futureDisc.data.uuid),
    'Future discount NOT in active list',
  );
  assert(
    !activeUuids.includes(expiredDisc.data.uuid),
    'Expired discount NOT in active list',
  );
  assert(
    !activeUuids.includes(inactiveDisc.data.uuid),
    'Inactive discount NOT in active list',
  );

  // ================================================================
  // PROMO HISTORY
  // ================================================================
  console.log('\n--- Promo History ---');

  // History should exist for adminDiscount (CREATED entry)
  const historyRes = await api(
    'GET',
    `/discounts/${adminDiscount.data.uuid}/history`,
    adminToken,
  );
  assert(historyRes.status === 200, 'GET /discounts/:uuid/history returns 200');
  const historyEntries = Array.isArray(historyRes.data)
    ? historyRes.data
    : historyRes.data.data;
  assert(Array.isArray(historyEntries), 'Returns history list payload');
  assert(historyEntries.length >= 1, 'Has at least 1 history entry');
  assert(
    historyEntries[0].action === 'CREATED',
    'First history action is CREATED',
  );

  // Update discount → should add MODIFIED history
  const updateDisc = await api(
    'PATCH',
    `/discounts/${adminDiscount.data.uuid}`,
    adminToken,
    {
      value: '75.0000',
    },
  );
  assert(updateDisc.status === 200, 'Updated discount value');

  const historyAfterUpdate = await api(
    'GET',
    `/discounts/${adminDiscount.data.uuid}/history`,
    adminToken,
  );
  const historyAfterUpdateEntries = Array.isArray(historyAfterUpdate.data)
    ? historyAfterUpdate.data
    : historyAfterUpdate.data.data;
  assert(
    historyAfterUpdateEntries.length >= 2,
    'Has at least 2 history entries after update',
  );
  const modEntry = historyAfterUpdateEntries.find(
    (h: any) => h.action === 'MODIFIED',
  );
  assert(!!modEntry, 'Has MODIFIED entry');
  assert(
    modEntry.newValue.value === '75.0000',
    'New value recorded in history',
  );

  // Deactivate → DEACTIVATED history
  await api('PATCH', `/discounts/${adminDiscount.data.uuid}`, adminToken, {
    isActive: false,
  });
  const historyAfterDeact = await api(
    'GET',
    `/discounts/${adminDiscount.data.uuid}/history`,
    adminToken,
  );
  const historyAfterDeactEntries = Array.isArray(historyAfterDeact.data)
    ? historyAfterDeact.data
    : historyAfterDeact.data.data;
  const deactEntry = historyAfterDeactEntries.find(
    (h: any) => h.action === 'DEACTIVATED',
  );
  assert(!!deactEntry, 'Has DEACTIVATED entry');

  // Reactivate → ACTIVATED history
  await api('PATCH', `/discounts/${adminDiscount.data.uuid}`, adminToken, {
    isActive: true,
  });
  const historyAfterReact = await api(
    'GET',
    `/discounts/${adminDiscount.data.uuid}/history`,
    adminToken,
  );
  const historyAfterReactEntries = Array.isArray(historyAfterReact.data)
    ? historyAfterReact.data
    : historyAfterReact.data.data;
  const actEntry = historyAfterReactEntries.find(
    (h: any) => h.action === 'ACTIVATED',
  );
  assert(!!actEntry, 'Has ACTIVATED entry');

  // ================================================================
  // DISCOUNT APPLICATION ON TRANSACTIONS
  // ================================================================
  console.log('\n--- Discount on Transactions ---');

  // Setup: store, session, products
  const storeRes = await api('POST', '/stores', adminToken, {
    name: `Disc Store ${ts}`,
    address: '200 Promo St',
    contactPhone: '+63-917-555-0200',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  const sessionRes = await api('POST', '/cash-register-sessions', adminToken, {
    storeId,
    deviceId: Number(String(ts).slice(-6)),
    openedAt: new Date().toISOString(),
    openingCash: '5000.0000',
  });
  assert(sessionRes.status === 201, 'Created session');
  const sessionId = sessionRes.data.id;

  const catRes = await api('POST', '/categories', adminToken, {
    name: `Disc Cat ${ts}`,
    sortOrder: 1,
  });
  const prodRes = await api('POST', '/products', adminToken, {
    name: `Disc Product ${ts}`,
    sku: `SKU-DISC-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '1000.0000',
    unit: 'piece',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(prodRes.status === 201, 'Created product (₱1000, 12% VAT)');
  const productId = prodRes.data.id;

  // Create a percentage discount for transaction
  const percDisc = await api('POST', '/discounts', adminToken, {
    name: `10% Off Sale ${ts}`,
    type: 'PERCENTAGE',
    value: '10.0000',
    isActive: true,
  });
  assert(percDisc.status === 201, 'Created 10% discount');

  // Transaction with 10% discount
  // 1x product @ 1000, subtotal=1000, vat=120, discount=10%of1000=100, total=1000+120-100=1020
  const discTxn = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: percDisc.data.id,
    lineItems: [{ productId, quantity: 1 }],
    payments: [
      { method: 'CASH', amount: '1020.0000', amountTendered: '1100.0000' },
    ],
  });
  assert(discTxn.status === 201, 'Created transaction with 10% discount');
  assert(
    discTxn.data.subtotal === '1000.0000',
    `Subtotal is 1000 (got ${discTxn.data.subtotal})`,
  );
  assert(
    discTxn.data.vatAmount === '120.0000',
    `VAT is 120 (got ${discTxn.data.vatAmount})`,
  );
  assert(
    discTxn.data.discountAmount === '100.0000',
    `Discount is 100 (got ${discTxn.data.discountAmount})`,
  );
  assert(
    discTxn.data.totalAmount === '1020.0000',
    `Total is 1020 (got ${discTxn.data.totalAmount})`,
  );
  assert(discTxn.data.discountId === percDisc.data.id, 'discountId recorded');

  // Fixed amount discount
  const fixedDisc = await api('POST', '/discounts', adminToken, {
    name: `₱200 Off ${ts}`,
    type: 'FIXED_AMOUNT',
    value: '200.0000',
    isActive: true,
  });
  assert(fixedDisc.status === 201, 'Created ₱200 fixed discount');

  // Transaction with fixed discount
  // 2x product @ 1000, subtotal=2000, vat=240, discount=200, total=2000+240-200=2040
  const fixedTxn = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: fixedDisc.data.id,
    lineItems: [{ productId, quantity: 2 }],
    payments: [
      { method: 'CASH', amount: '2040.0000', amountTendered: '2100.0000' },
    ],
  });
  assert(
    fixedTxn.status === 201,
    'Created transaction with ₱200 fixed discount',
  );
  assert(
    fixedTxn.data.discountAmount === '200.0000',
    `Fixed discount amount (got ${fixedTxn.data.discountAmount})`,
  );
  assert(
    fixedTxn.data.totalAmount === '2040.0000',
    `Total with fixed discount (got ${fixedTxn.data.totalAmount})`,
  );

  // Inactive discount cannot be applied
  const inactiveRes = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: inactiveDisc.data.id,
    lineItems: [{ productId, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '1000.0000' }],
  });
  assert(inactiveRes.status === 400, 'Inactive discount returns 400');

  // Expired discount cannot be applied
  const expiredRes = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: expiredDisc.data.id,
    lineItems: [{ productId, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '1000.0000' }],
  });
  assert(expiredRes.status === 400, 'Expired discount returns 400');

  // Nonexistent discount returns 404
  const nonExistRes = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: 999999,
    lineItems: [{ productId, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '1200.0000' }],
  });
  assert(nonExistRes.status === 404, 'Non-existent discountId returns 404');

  // Promo history should have APPLIED entry for the discount transaction
  const promoHist = await api(
    'GET',
    `/discounts/${percDisc.data.uuid}/history`,
    adminToken,
  );
  const promoHistoryEntries = Array.isArray(promoHist.data)
    ? promoHist.data
    : promoHist.data.data;
  const appliedEntry = promoHistoryEntries.find(
    (h: any) => h.action === 'APPLIED',
  );
  assert(!!appliedEntry, 'Promo history has APPLIED entry after transaction');
  assert(
    appliedEntry.transactionId === discTxn.data.id,
    'APPLIED entry references correct transaction',
  );

  // Transaction without discount still works fine
  const noDiscTxn = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    lineItems: [{ productId, quantity: 1 }],
    payments: [
      { method: 'CASH', amount: '1120.0000', amountTendered: '1200.0000' },
    ],
  });
  assert(noDiscTxn.status === 201, 'Transaction without discount still works');
  assert(noDiscTxn.data.discountAmount === '0.0000', 'No discount applied');
  assert(noDiscTxn.data.totalAmount === '1120.0000', 'Total = subtotal + VAT');

  // Min purchase discount - create one with minimum
  const minDisc = await api('POST', '/discounts', adminToken, {
    name: `Min 5000 Disc ${ts}`,
    type: 'PERCENTAGE',
    value: '5.0000',
    minPurchase: '5000.0000',
    isActive: true,
  });
  assert(minDisc.status === 201, 'Created min purchase discount');

  // Try to use it with purchase below minimum
  const belowMin = await api('POST', '/transactions', adminToken, {
    storeId,
    sessionId,
    discountId: minDisc.data.id,
    lineItems: [{ productId, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '1200.0000' }],
  });
  assert(belowMin.status === 400, 'Below minimum purchase returns 400');

  // ================================================================
  console.log('\n🎉 All Permission & Discount E2E tests passed!\n');
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
