/**
 * E2E POS Transaction Test Script
 *
 * Tests Transaction, LineItem, and Payment CRUD
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
  console.log('\n🛒 JSSI POS — Transaction E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  const ts = Date.now();

  // === PRE-REQUISITES ===
  // Create store
  const storeRes = await api('POST', '/stores', token, {
    name: `POS Store ${ts}`,
    address: '100 POS Ave',
    contactPhone: '+63-917-555-0900',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  // Create cash register session
  const sessionRes = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId: Number(String(ts).slice(-6)),
    openedAt: new Date().toISOString(),
    openingCash: '5000.0000',
  });
  assert(sessionRes.status === 201, 'Created cash register session');
  const sessionId = sessionRes.data.id;

  // Create category + products
  const catRes = await api('POST', '/categories', token, {
    name: `POS Cat ${ts}`,
    sortOrder: 1,
  });
  assert(catRes.status === 201, 'Created category');

  const prod1Res = await api('POST', '/products', token, {
    name: `Rice 5kg ${ts}`,
    sku: `SKU-POS-RICE-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '250.0000',
    unit: 'bag',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(prod1Res.status === 201, 'Created product 1 (Rice)');
  const product1Id = prod1Res.data.id;

  const prod2Res = await api('POST', '/products', token, {
    name: `Cooking Oil 1L ${ts}`,
    sku: `SKU-POS-OIL-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '85.0000',
    unit: 'bottle',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(prod2Res.status === 201, 'Created product 2 (Oil)');
  const product2Id = prod2Res.data.id;

  const prod3Res = await api('POST', '/products', token, {
    name: `Medicine ${ts}`,
    sku: `SKU-POS-MED-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '120.0000',
    unit: 'box',
    vatType: 'VAT_EXEMPT',
    vatRate: '0.0000',
  });
  assert(prod3Res.status === 201, 'Created product 3 (Medicine, VAT_EXEMPT)');
  const product3Id = prod3Res.data.id;

  // ================================================================
  // TRANSACTION CREATION
  // ================================================================
  console.log('\n--- Transaction Creation ---');

  // Simple transaction: 2x Rice + 1x Oil, cash payment
  const txn1 = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [
      { productId: product1Id, quantity: 2 },
      { productId: product2Id, quantity: 1 },
    ],
    payments: [
      { method: 'CASH', amount: '655.2000', amountTendered: '700.0000' },
    ],
  });
  assert(txn1.status === 201, 'POST /transactions returns 201');
  const transaction1 = txn1.data;
  assert(
    transaction1.status === 'COMPLETED',
    'Transaction status is COMPLETED',
  );
  assert(transaction1.storeId === storeId, 'storeId matches');
  assert(transaction1.sessionId === sessionId, 'sessionId matches');
  assert(!!transaction1.transactionNumber, 'Has transaction number');
  assert(!!transaction1.uuid, 'Has UUID');
  assert(transaction1.tenantId === 1, 'tenantId matches');
  // subtotal = 2*250 + 1*85 = 585
  assert(
    transaction1.subtotal === '585.0000',
    `Subtotal is 585.0000 (got ${transaction1.subtotal})`,
  );
  // vat = 585 * 0.12 = 70.20
  assert(
    transaction1.vatAmount === '70.2000',
    `VAT amount is 70.2000 (got ${transaction1.vatAmount})`,
  );
  // total = 585 + 70.20 = 655.20
  assert(
    transaction1.totalAmount === '655.2000',
    `Total is 655.2000 (got ${transaction1.totalAmount})`,
  );
  assert(transaction1.lineItems.length === 2, 'Has 2 line items');
  assert(transaction1.payments.length === 1, 'Has 1 payment');
  console.log('  Transaction:', transaction1.uuid);

  // Verify line items detail
  const li1 = transaction1.lineItems.find(
    (li: any) => li.productId === product1Id,
  );
  assert(li1.quantity === 2, 'Line item 1 quantity is 2');
  assert(li1.unitPrice === '250.0000', 'Line item 1 unit price matches');
  assert(li1.lineTotal === '500.0000', 'Line item 1 line total = 500');
  assert(li1.vatType === 'VATABLE', 'Line item 1 vatType matches');

  // Verify payment detail
  const pay1 = transaction1.payments[0];
  assert(pay1.method === 'CASH', 'Payment method is CASH');
  assert(pay1.status === 'COMPLETED', 'Payment status is COMPLETED');
  assert(pay1.amount === '655.2000', 'Payment amount matches');
  assert(pay1.amountTendered === '700.0000', 'Amount tendered matches');
  assert(
    pay1.changeGiven === '44.8000',
    `Change given is 44.8000 (got ${pay1.changeGiven})`,
  );

  // Transaction with VAT_EXEMPT product
  const txn2 = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: product3Id, quantity: 3 }],
    payments: [
      { method: 'GCASH', amount: '360.0000', referenceNumber: 'GCASH-REF-001' },
    ],
  });
  assert(txn2.status === 201, 'Created transaction with VAT_EXEMPT product');
  const transaction2 = txn2.data;
  // subtotal = 3*120 = 360, vat = 0 (exempt)
  assert(transaction2.subtotal === '360.0000', 'VAT exempt subtotal correct');
  assert(transaction2.vatAmount === '0.0000', 'VAT exempt has zero VAT');
  assert(
    transaction2.totalAmount === '360.0000',
    'VAT exempt total equals subtotal',
  );

  // Multiple payment methods (split payment)
  const txn3 = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [
      { productId: product1Id, quantity: 1 },
      { productId: product3Id, quantity: 2 },
    ],
    payments: [
      { method: 'CASH', amount: '300.0000', amountTendered: '300.0000' },
      { method: 'MAYA', amount: '220.0000', referenceNumber: 'MAYA-REF-001' },
    ],
  });
  assert(txn3.status === 201, 'Created split payment transaction');
  const transaction3 = txn3.data;
  assert(transaction3.payments.length === 2, 'Has 2 payments');
  // subtotal = 250 + 240 = 490, vat on rice only = 250*0.12=30, total = 520
  assert(
    transaction3.subtotal === '490.0000',
    `Split payment subtotal (got ${transaction3.subtotal})`,
  );

  // ================================================================
  // LIST & GET TRANSACTIONS
  // ================================================================
  console.log('\n--- List & Get ---');

  const listAll = await api('GET', '/transactions', token);
  assert(listAll.status === 200, 'GET /transactions returns 200');
  assert(Array.isArray(listAll.data.data), 'Returns paginated data array');
  assert(listAll.data.data.length >= 3, 'At least 3 transactions');

  // Filter by storeId
  const listByStore = await api(
    'GET',
    `/transactions?storeId=${storeId}`,
    token,
  );
  assert(listByStore.status === 200, 'Filter by storeId works');
  assert(listByStore.data.data.length >= 3, 'All 3 from this store');

  // Get single with details
  const getOne = await api('GET', `/transactions/${transaction1.uuid}`, token);
  assert(getOne.status === 200, 'GET /transactions/:uuid returns 200');
  assert(getOne.data.uuid === transaction1.uuid, 'UUID matches');
  assert(getOne.data.lineItems.length === 2, 'Includes line items');
  assert(getOne.data.payments.length === 1, 'Includes payments');

  // Get line items endpoint
  const getLineItems = await api(
    'GET',
    `/transactions/${transaction1.uuid}/line-items`,
    token,
  );
  assert(
    getLineItems.status === 200,
    'GET /transactions/:uuid/line-items returns 200',
  );
  assert(getLineItems.data.length === 2, 'Returns 2 line items');

  // Get payments endpoint
  const getPayments = await api(
    'GET',
    `/transactions/${transaction1.uuid}/payments`,
    token,
  );
  assert(
    getPayments.status === 200,
    'GET /transactions/:uuid/payments returns 200',
  );
  assert(getPayments.data.length === 1, 'Returns 1 payment');

  // Not found
  const notFound = await api(
    'GET',
    '/transactions/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFound.status === 404, 'Returns 404 for nonexistent transaction');

  // ================================================================
  // VOID TRANSACTION
  // ================================================================
  console.log('\n--- Void Transaction ---');

  const voidRes = await api(
    'PATCH',
    `/transactions/${transaction2.uuid}/void`,
    token,
  );
  assert(voidRes.status === 200, 'PATCH /transactions/:uuid/void returns 200');
  assert(voidRes.data.status === 'VOIDED', 'Transaction status is VOIDED');

  // Cannot void again
  const voidAgain = await api(
    'PATCH',
    `/transactions/${transaction2.uuid}/void`,
    token,
  );
  assert(
    voidAgain.status === 400,
    'Cannot void already-voided transaction (400)',
  );

  // ================================================================
  // VALIDATION
  // ================================================================
  console.log('\n--- Validation ---');

  // No line items
  const noItems = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [],
    payments: [{ method: 'CASH', amount: '100.0000' }],
  });
  assert(noItems.status === 400, 'Empty lineItems returns 400');

  // No payments
  const noPayments = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: product1Id, quantity: 1 }],
    payments: [],
  });
  assert(noPayments.status === 400, 'Empty payments returns 400');

  // Invalid product ID
  const badProduct = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: 999999, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '100.0000' }],
  });
  assert(badProduct.status === 404, 'Invalid productId returns 404');

  // Insufficient payment
  const shortPayment = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: product1Id, quantity: 10 }],
    payments: [{ method: 'CASH', amount: '1.0000' }],
  });
  assert(shortPayment.status === 400, 'Insufficient payment returns 400');

  // Missing required fields
  const emptyBody = await api('POST', '/transactions', token, {});
  assert(emptyBody.status === 400, 'Empty body returns 400');

  // Invalid payment method
  const badMethod = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: product1Id, quantity: 1 }],
    payments: [{ method: 'BITCOIN', amount: '300.0000' }],
  });
  assert(badMethod.status === 400, 'Invalid payment method returns 400');

  // ================================================================
  // INVENTORY DEDUCTION ON SALE
  // ================================================================
  console.log('\n--- Inventory Deduction ---');

  // Create stock levels for products at this store
  const sl1Res = await api('POST', '/stock-levels', token, {
    storeId,
    productId: product1Id,
    currentQuantity: 100,
    reorderThreshold: 10,
    criticalThreshold: 5,
  });
  assert(sl1Res.status === 201, 'Created stock level for product 1');
  const stockLevel1Uuid = sl1Res.data.uuid;

  const sl2Res = await api('POST', '/stock-levels', token, {
    storeId,
    productId: product2Id,
    currentQuantity: 50,
    reorderThreshold: 5,
    criticalThreshold: 2,
  });
  assert(sl2Res.status === 201, 'Created stock level for product 2');
  const stockLevel2Uuid = sl2Res.data.uuid;

  // Create a transaction that should deduct stock
  const stockTxn = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [
      { productId: product1Id, quantity: 3 },
      { productId: product2Id, quantity: 2 },
    ],
    payments: [
      { method: 'CASH', amount: '1030.4000', amountTendered: '1100.0000' },
    ],
  });
  assert(
    stockTxn.status === 201,
    'Created transaction for stock deduction test',
  );

  // Verify stock levels were deducted
  const sl1After = await api('GET', `/stock-levels/${stockLevel1Uuid}`, token);
  assert(sl1After.status === 200, 'GET stock level 1 after sale');
  assert(
    sl1After.data.currentQuantity === 97,
    `Stock 1 deducted: 100-3=97 (got ${sl1After.data.currentQuantity})`,
  );

  const sl2After = await api('GET', `/stock-levels/${stockLevel2Uuid}`, token);
  assert(sl2After.status === 200, 'GET stock level 2 after sale');
  assert(
    sl2After.data.currentQuantity === 48,
    `Stock 2 deducted: 50-2=48 (got ${sl2After.data.currentQuantity})`,
  );

  // Void the transaction and verify stock is restored
  const voidStockTxn = await api(
    'PATCH',
    `/transactions/${stockTxn.data.uuid}/void`,
    token,
  );
  assert(voidStockTxn.status === 200, 'Voided the stock deduction transaction');

  const sl1Restored = await api(
    'GET',
    `/stock-levels/${stockLevel1Uuid}`,
    token,
  );
  assert(
    sl1Restored.data.currentQuantity === 100,
    `Stock 1 restored: 97+3=100 (got ${sl1Restored.data.currentQuantity})`,
  );

  const sl2Restored = await api(
    'GET',
    `/stock-levels/${stockLevel2Uuid}`,
    token,
  );
  assert(
    sl2Restored.data.currentQuantity === 50,
    `Stock 2 restored: 48+2=50 (got ${sl2Restored.data.currentQuantity})`,
  );

  // Stock can go negative (no blocking — POS should never fail a sale)
  const sl3Res = await api('POST', '/stock-levels', token, {
    storeId,
    productId: product3Id,
    currentQuantity: 1,
    reorderThreshold: 5,
    criticalThreshold: 2,
  });
  assert(sl3Res.status === 201, 'Created stock level with qty 1');

  const oversellTxn = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [{ productId: product3Id, quantity: 5 }],
    payments: [
      { method: 'CASH', amount: '600.0000', amountTendered: '600.0000' },
    ],
  });
  assert(
    oversellTxn.status === 201,
    'Oversell transaction succeeds (no stock blocking)',
  );

  const sl3After = await api('GET', `/stock-levels/${sl3Res.data.uuid}`, token);
  assert(
    sl3After.data.currentQuantity === 1,
    `Stock does not go below zero when insufficient (got ${sl3After.data.currentQuantity})`,
  );

  // ================================================================
  // AUTH & ROLES
  // ================================================================
  console.log('\n--- Auth & Roles ---');

  // No token
  const noAuth = await fetch(`${API_BASE}/transactions`, { method: 'GET' });
  assert(noAuth.status === 401, 'GET without token returns 401');

  // DRIVER cannot access
  const driverToken = await getAuthToken('DRIVER');
  const driverAccess = await api('GET', '/transactions', driverToken);
  assert(driverAccess.status === 403, 'DRIVER returns 403');

  // CASHIER can create
  const cashierToken = await getAuthToken('CASHIER');
  const cashierTxn = await api('POST', '/transactions', cashierToken, {
    storeId,
    sessionId,
    lineItems: [{ productId: product2Id, quantity: 1 }],
    payments: [
      { method: 'CASH', amount: '95.2000', amountTendered: '100.0000' },
    ],
  });
  assert(cashierTxn.status === 201, 'CASHIER can create transactions');

  // CASHIER cannot void
  const cashierVoid = await api(
    'PATCH',
    `/transactions/${cashierTxn.data.uuid}/void`,
    cashierToken,
  );
  assert(cashierVoid.status === 403, 'CASHIER cannot void transactions (403)');

  // STORE_MANAGER can void
  const managerToken = await getAuthToken('STORE_MANAGER');
  const managerVoid = await api(
    'PATCH',
    `/transactions/${cashierTxn.data.uuid}/void`,
    managerToken,
  );
  assert(managerVoid.status === 200, 'STORE_MANAGER can void transactions');

  // ================================================================
  console.log('\n🎉 All POS Transaction E2E tests passed!\n');
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
