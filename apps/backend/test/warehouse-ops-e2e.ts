/**
 * E2E Warehouse Ops Test Script
 *
 * Tests Batch, Dispatch, DispatchItem, and ReceivingRecord CRUD
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
  console.log('\n🏭 JSSI POS — Warehouse Ops E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  const ts = Date.now();

  // === PRE-REQUISITES ===
  const whRes = await api('POST', '/warehouses', token, {
    name: `WH Ops Test ${ts}`,
    address: '100 Ops Ave',
    contactPhone: '+63-917-555-0400',
  });
  assert(whRes.status === 201, 'Created warehouse');
  const warehouseId = whRes.data.id;

  const storeRes = await api('POST', '/stores', token, {
    name: `Store Ops Test ${ts}`,
    address: '200 Retail St',
    contactPhone: '+63-917-555-0401',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  const supRes = await api('POST', '/suppliers', token, {
    name: `Supplier Ops Test ${ts}`,
  });
  assert(supRes.status === 201, 'Created supplier');
  const supplierId = supRes.data.id;

  const catRes = await api('POST', '/categories', token, {
    name: `WH Ops Cat ${ts}`,
    sortOrder: 50,
  });
  const prodRes = await api('POST', '/products', token, {
    name: `WH Ops Product ${ts}`,
    sku: `SKU-WHOPS-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '50.0000',
    unit: 'pcs',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  assert(prodRes.status === 201, 'Created product');
  const productId = prodRes.data.id;

  // ================================================================
  // BATCH CRUD
  // ================================================================
  console.log('\n--- Batch CRUD ---');

  const createBatch = await api('POST', '/batches', token, {
    productId,
    warehouseId,
    supplierId,
    batchNumber: `BATCH-${ts}-001`,
    quantity: 100,
    costPrice: '45.0000',
    expiryDate: '2027-06-30',
    deliveryDate: '2026-05-15',
  });
  assert(createBatch.status === 201, 'POST /batches returns 201');
  const batch = createBatch.data;
  assert(batch.batchNumber === `BATCH-${ts}-001`, 'Batch number matches');
  assert(batch.quantity === 100, 'Quantity matches');
  assert(batch.costPrice === '45.0000', 'Cost price matches');
  assert(batch.expiryDate === '2027-06-30', 'Expiry date matches');
  assert(batch.tenantId === 1, 'Batch tenantId matches');
  console.log('  Created:', batch.uuid);

  // Create 2nd batch
  const createBatch2 = await api('POST', '/batches', token, {
    productId,
    warehouseId,
    supplierId,
    batchNumber: `BATCH-${ts}-002`,
    quantity: 50,
    costPrice: '46.0000',
    deliveryDate: '2026-05-16',
  });
  assert(createBatch2.status === 201, 'POST /batches (2nd) returns 201');

  // List
  const listBatches = await api('GET', '/batches', token);
  assert(listBatches.status === 200, 'GET /batches returns 200');
  const batches = Array.isArray(listBatches.data)
    ? listBatches.data
    : listBatches.data.data;
  assert(Array.isArray(batches), 'Returns batch list payload');
  assert(batches.length >= 2, 'Has at least 2 batches');

  // Filter by warehouse
  const filteredBatches = await api(
    'GET',
    `/batches?warehouseId=${warehouseId}`,
    token,
  );
  assert(
    [200, 400].includes(filteredBatches.status),
    'GET /batches?warehouseId returns supported status',
  );

  // Get by UUID
  const getBatch = await api('GET', `/batches/${batch.uuid}`, token);
  assert(getBatch.status === 200, 'GET /batches/:uuid returns 200');

  // Update
  const patchBatch = await api('PATCH', `/batches/${batch.uuid}`, token, {
    quantity: 95,
  });
  assert(patchBatch.status === 200, 'PATCH /batches/:uuid returns 200');
  assert(patchBatch.data.quantity === 95, 'Quantity updated');

  // Delete
  const delBatch = await api(
    'DELETE',
    `/batches/${createBatch2.data.uuid}`,
    token,
  );
  assert(delBatch.status === 200, 'DELETE /batches/:uuid returns 200');

  // ================================================================
  // DISPATCH CRUD
  // ================================================================
  console.log('\n--- Dispatch CRUD ---');

  const createDisp = await api('POST', '/dispatches', token, {
    warehouseId,
    storeId,
    dispatchDate: '2026-05-15',
    notes: 'Regular weekly dispatch',
  });
  assert(createDisp.status === 201, 'POST /dispatches returns 201');
  const disp = createDisp.data;
  assert(disp.status === 'PENDING', 'Default status is PENDING');
  assert(disp.warehouseId === warehouseId, 'warehouseId matches');
  assert(disp.storeId === storeId, 'storeId matches');
  console.log('  Created:', disp.uuid);

  // List
  const listDisp = await api('GET', '/dispatches', token);
  assert(listDisp.status === 200, 'GET /dispatches returns 200');
  const dispatches = Array.isArray(listDisp.data)
    ? listDisp.data
    : listDisp.data.data;
  assert(Array.isArray(dispatches), 'Returns dispatch list payload');

  // Get by UUID
  const getDisp = await api('GET', `/dispatches/${disp.uuid}`, token);
  assert(getDisp.status === 200, 'GET /dispatches/:uuid returns 200');

  // Keep dispatch in PENDING while editing items; DISPATCHED transition happens after items are finalized.

  // ================================================================
  // DISPATCH ITEM CRUD
  // ================================================================
  console.log('\n--- DispatchItem CRUD ---');

  const createDI = await api('POST', '/dispatch-items', token, {
    dispatchId: disp.id,
    batchId: batch.id,
    quantity: 20,
  });
  assert(createDI.status === 201, 'POST /dispatch-items returns 201');
  const di = createDI.data;
  assert(di.dispatchId === disp.id, 'dispatchId matches');
  assert(di.batchId === batch.id, 'batchId matches');
  assert(di.quantity === 20, 'Quantity matches');
  console.log('  Created:', di.uuid);

  // Create 2nd item
  const createDI2 = await api('POST', '/dispatch-items', token, {
    dispatchId: disp.id,
    batchId: batch.id,
    quantity: 10,
  });
  assert(createDI2.status === 201, 'POST /dispatch-items (2nd) returns 201');

  // List by dispatch
  const listDI = await api(
    'GET',
    `/dispatch-items?dispatchId=${disp.id}`,
    token,
  );
  assert(listDI.status === 200, 'GET /dispatch-items?dispatchId returns 200');
  assert(listDI.data.length >= 2, 'Has at least 2 dispatch items');

  // Update
  const patchDI = await api('PATCH', `/dispatch-items/${di.uuid}`, token, {
    quantity: 25,
  });
  assert(patchDI.status === 200, 'PATCH /dispatch-items/:uuid returns 200');
  assert(patchDI.data.quantity === 25, 'Quantity updated');

  // Delete
  const delDI = await api(
    'DELETE',
    `/dispatch-items/${createDI2.data.uuid}`,
    token,
  );
  assert(delDI.status === 200, 'DELETE /dispatch-items/:uuid returns 200');

  // Update status after items are ready
  const patchDisp = await api('PATCH', `/dispatches/${disp.uuid}`, token, {
    status: 'DISPATCHED',
  });
  assert(patchDisp.status === 200, 'PATCH /dispatches/:uuid returns 200');
  assert(patchDisp.data.status === 'DISPATCHED', 'Status updated');

  // ================================================================
  // RECEIVING RECORD CRUD
  // ================================================================
  console.log('\n--- ReceivingRecord CRUD ---');

  const createRR = await api('POST', '/receiving-records', token, {
    storeId,
    dispatchId: disp.id,
    receivedDate: '2026-05-16',
    notes: 'All items received in good condition',
  });
  assert(createRR.status === 201, 'POST /receiving-records returns 201');
  const rr = createRR.data;
  assert(rr.status === 'PENDING', 'Default status is PENDING');
  assert(rr.storeId === storeId, 'storeId matches');
  assert(rr.dispatchId === disp.id, 'dispatchId matches');
  console.log('  Created:', rr.uuid);

  // List
  const listRR = await api('GET', '/receiving-records', token);
  assert(listRR.status === 200, 'GET /receiving-records returns 200');
  const receivingRecords = Array.isArray(listRR.data)
    ? listRR.data
    : listRR.data.data;
  assert(
    Array.isArray(receivingRecords),
    'Returns receiving record list payload',
  );

  // Get by UUID
  const getRR = await api('GET', `/receiving-records/${rr.uuid}`, token);
  assert(getRR.status === 200, 'GET /receiving-records/:uuid returns 200');

  // Update
  const patchRR = await api('PATCH', `/receiving-records/${rr.uuid}`, token, {
    status: 'COMPLETE',
    notes: 'Verified and complete',
  });
  assert(patchRR.status === 200, 'PATCH /receiving-records/:uuid returns 200');
  assert(patchRR.data.status === 'COMPLETE', 'Status updated');

  // Delete
  const delRR = await api('DELETE', `/receiving-records/${rr.uuid}`, token);
  assert(
    delRR.status === 400,
    'DELETE /receiving-records/:uuid returns 400 for completed records',
  );

  // ================================================================
  // VALIDATION
  // ================================================================
  console.log('\n--- Validation ---');

  const badBatch = await api('POST', '/batches', token, {});
  assert(badBatch.status === 400, 'POST /batches with empty body returns 400');

  const badDisp = await api('POST', '/dispatches', token, {});
  assert(
    badDisp.status === 400,
    'POST /dispatches with empty body returns 400',
  );

  const badDI = await api('POST', '/dispatch-items', token, {});
  assert(
    badDI.status === 400,
    'POST /dispatch-items with empty body returns 400',
  );

  const badRR = await api('POST', '/receiving-records', token, {});
  assert(
    badRR.status === 400,
    'POST /receiving-records with empty body returns 400',
  );

  // ================================================================
  // AUTH GUARD
  // ================================================================
  console.log('\n--- Auth guard ---');

  const noAuth = await fetch(`${API_BASE}/batches`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(noAuth.status === 401, 'GET /batches without token returns 401');

  // ================================================================
  // ROLE-BASED ACCESS
  // ================================================================
  console.log('\n--- Role-based access ---');

  const cashierToken = await getAuthToken('CASHIER');
  const cashierBatch = await api('GET', '/batches', cashierToken);
  assert(cashierBatch.status === 403, 'CASHIER cannot read batches (403)');

  const whStaffToken = await getAuthToken('WAREHOUSE_STAFF');
  const whStaffBatch = await api('POST', '/batches', whStaffToken, {
    productId,
    warehouseId,
    supplierId,
    batchNumber: `BATCH-STAFF-${ts}`,
    quantity: 10,
    costPrice: '40.0000',
    deliveryDate: '2026-05-17',
  });
  assert(whStaffBatch.status === 201, 'WAREHOUSE_STAFF can create batch');

  const whStaffDel = await api(
    'DELETE',
    `/batches/${whStaffBatch.data.uuid}`,
    whStaffToken,
  );
  assert(
    whStaffDel.status === 403,
    'WAREHOUSE_STAFF cannot delete batch (403)',
  );

  console.log('\n🎉 All Warehouse Ops tests passed!\n');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
