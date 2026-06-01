/**
 * E2E Procurement Test Script
 *
 * Tests Supplier, PurchaseOrder, and PurchaseOrderItem CRUD
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 *   - Warehouse must exist (creates one for the test)
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
  console.log('\n📋 JSSI POS — Procurement E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  // === PRE-REQUISITE: Create a warehouse for PO tests ===
  const whRes = await api('POST', '/warehouses', token, {
    name: `Test Warehouse ${Date.now()}`,
    address: '999 Procurement Ave',
    contactPhone: '+63-917-555-0300',
  });
  assert(whRes.status === 201, 'Created warehouse for PO tests');
  const warehouseId = whRes.data.id;

  // ================================================================
  // SUPPLIER CRUD
  // ================================================================
  console.log('\n--- Supplier CRUD ---');

  const ts = Date.now();

  const createSup = await api('POST', '/suppliers', token, {
    name: `ABC Trading Corp ${ts}`,
    contactPerson: 'Jose Reyes',
    contactPhone: '+63-917-555-0200',
    contactEmail: 'jose@abctrading.com',
    address: '100 Supplier St, Quezon City',
  });
  assert(createSup.status === 201, 'POST /suppliers returns 201');
  const sup = createSup.data;
  assert(sup.name === `ABC Trading Corp ${ts}`, 'Supplier name matches');
  assert(sup.contactPerson === 'Jose Reyes', 'Contact person matches');
  assert(sup.tenantId === 1, 'Supplier tenantId matches claim');
  console.log('  Created:', sup.uuid);

  // Duplicate name conflict
  const dupSup = await api('POST', '/suppliers', token, {
    name: `ABC Trading Corp ${ts}`,
  });
  assert(dupSup.status === 409, 'Duplicate supplier name returns 409');

  // Create 2nd supplier
  const createSup2 = await api('POST', '/suppliers', token, {
    name: `XYZ Distributors ${ts}`,
    contactEmail: 'info@xyz.ph',
  });
  assert(createSup2.status === 201, 'POST /suppliers (2nd) returns 201');

  // List
  const listSup = await api('GET', '/suppliers', token);
  assert(listSup.status === 200, 'GET /suppliers returns 200');
  const suppliers = Array.isArray(listSup.data)
    ? listSup.data
    : listSup.data.data;
  assert(Array.isArray(suppliers), 'Returns supplier list payload');
  assert(suppliers.length >= 2, 'Has at least 2 suppliers');

  // Check ordering (name ASC)
  const supNames = suppliers.map((s: any) => s.name);
  const sortedSupNames = [...supNames].sort();
  assert(
    JSON.stringify(supNames) === JSON.stringify(sortedSupNames),
    'Suppliers sorted by name',
  );

  // Get by UUID
  const getSup = await api('GET', `/suppliers/${sup.uuid}`, token);
  assert(getSup.status === 200, 'GET /suppliers/:uuid returns 200');
  assert(getSup.data.uuid === sup.uuid, 'UUID matches');

  // Update
  const patchSup = await api('PATCH', `/suppliers/${sup.uuid}`, token, {
    contactPhone: '+63-917-555-0299',
    isActive: false,
  });
  assert(patchSup.status === 200, 'PATCH /suppliers/:uuid returns 200');
  assert(patchSup.data.contactPhone === '+63-917-555-0299', 'Phone updated');
  assert(patchSup.data.isActive === false, 'isActive set to false');

  // Delete 2nd supplier
  const delSup = await api(
    'DELETE',
    `/suppliers/${createSup2.data.uuid}`,
    token,
  );
  assert(delSup.status === 200, 'DELETE /suppliers/:uuid returns 200');

  // Verify soft delete
  const listAfterDel = await api('GET', '/suppliers', token);
  const suppliersAfterDelete = Array.isArray(listAfterDel.data)
    ? listAfterDel.data
    : listAfterDel.data.data;
  const foundSup = suppliersAfterDelete.find(
    (s: any) => s.uuid === createSup2.data.uuid,
  );
  assert(!foundSup, 'Soft-deleted supplier not in list');

  // ================================================================
  // PURCHASE ORDER CRUD
  // ================================================================
  console.log('\n--- PurchaseOrder CRUD ---');

  const createPo = await api('POST', '/purchase-orders', token, {
    supplierId: sup.id,
    warehouseId,
    poNumber: `PO-${ts}-0001`,
    orderDate: '2026-05-15',
    expectedDeliveryDate: '2026-05-20',
    totalAmount: '15000.0000',
    notes: 'First test PO',
  });
  assert(createPo.status === 201, 'POST /purchase-orders returns 201');
  const po = createPo.data;
  assert(po.poNumber === `PO-${ts}-0001`, 'PO number matches');
  assert(po.status === 'DRAFT', 'Default status is DRAFT');
  assert(po.supplierId === sup.id, 'supplierId matches');
  assert(po.warehouseId === warehouseId, 'warehouseId matches');
  assert(po.orderedById === 1, 'orderedById set from claims');
  assert(po.tenantId === 1, 'PO tenantId matches claim');
  console.log('  Created:', po.uuid);

  // Duplicate PO number
  const dupPo = await api('POST', '/purchase-orders', token, {
    supplierId: sup.id,
    warehouseId,
    poNumber: `PO-${ts}-0001`,
    orderDate: '2026-05-15',
  });
  assert(dupPo.status === 409, 'Duplicate PO number returns 409');

  // Create 2nd PO
  const createPo2 = await api('POST', '/purchase-orders', token, {
    supplierId: sup.id,
    warehouseId,
    poNumber: `PO-${ts}-0002`,
    orderDate: '2026-05-16',
    status: 'SUBMITTED',
  });
  assert(createPo2.status === 201, 'POST /purchase-orders (2nd) returns 201');
  assert(createPo2.data.status === 'SUBMITTED', 'Status set from DTO');

  // List
  const listPo = await api('GET', '/purchase-orders', token);
  assert(listPo.status === 200, 'GET /purchase-orders returns 200');
  const purchaseOrders = Array.isArray(listPo.data)
    ? listPo.data
    : listPo.data.data;
  assert(Array.isArray(purchaseOrders), 'Returns purchase order list payload');
  assert(purchaseOrders.length >= 2, 'Has at least 2 purchase orders');

  // Get by UUID
  const getPo = await api('GET', `/purchase-orders/${po.uuid}`, token);
  assert(getPo.status === 200, 'GET /purchase-orders/:uuid returns 200');

  // Update status using valid transition chain: DRAFT -> SUBMITTED -> APPROVED
  const submitPo = await api('PATCH', `/purchase-orders/${po.uuid}`, token, {
    status: 'SUBMITTED',
  });
  assert(
    submitPo.status === 200,
    'PATCH /purchase-orders/:uuid to SUBMITTED returns 200',
  );
  assert(submitPo.data.status === 'SUBMITTED', 'Status updated to SUBMITTED');

  const patchPo = await api('PATCH', `/purchase-orders/${po.uuid}`, token, {
    status: 'APPROVED',
    totalAmount: '16000.0000',
  });
  assert(
    patchPo.status === 200,
    'PATCH /purchase-orders/:uuid to APPROVED returns 200',
  );
  assert(patchPo.data.status === 'APPROVED', 'Status updated to APPROVED');
  assert(patchPo.data.totalAmount === '16000.0000', 'Total amount updated');

  // Delete
  const delPo = await api(
    'DELETE',
    `/purchase-orders/${createPo2.data.uuid}`,
    token,
  );
  assert(delPo.status === 200, 'DELETE /purchase-orders/:uuid returns 200');

  // ================================================================
  // PURCHASE ORDER ITEM CRUD
  // ================================================================
  console.log('\n--- PurchaseOrderItem CRUD ---');

  // Need a product — create one via categories/products
  const catRes = await api('POST', '/categories', token, {
    name: `Procurement Test Cat ${Date.now()}`,
    sortOrder: 99,
  });
  const prodTs = Date.now();
  const prodRes = await api('POST', '/products', token, {
    name: `Test Product ${prodTs}`,
    sku: `SKU-PROC-${prodTs}`,
    categoryId: catRes.data.id,
    unitPrice: '100.0000',
    unit: 'pcs',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  const productId = prodRes.data.id;

  const createItem = await api('POST', '/purchase-order-items', token, {
    purchaseOrderId: po.id,
    productId,
    quantityOrdered: 50,
    unitCost: '85.5000',
    notes: 'First batch order',
  });
  assert(createItem.status === 201, 'POST /purchase-order-items returns 201');
  const item = createItem.data;
  assert(item.purchaseOrderId === po.id, 'purchaseOrderId matches');
  assert(item.productId === productId, 'productId matches');
  assert(item.quantityOrdered === 50, 'quantityOrdered matches');
  assert(item.unitCost === '85.5000', 'unitCost matches');
  assert(item.quantityReceived === 0, 'quantityReceived default 0');
  console.log('  Created:', item.uuid);

  // Create 2nd item
  const createItem2 = await api('POST', '/purchase-order-items', token, {
    purchaseOrderId: po.id,
    productId,
    quantityOrdered: 30,
    unitCost: '90.0000',
  });
  assert(
    createItem2.status === 201,
    'POST /purchase-order-items (2nd) returns 201',
  );

  // List by PO
  const listItems = await api(
    'GET',
    `/purchase-order-items?purchaseOrderId=${po.id}`,
    token,
  );
  assert(
    listItems.status === 200,
    'GET /purchase-order-items?purchaseOrderId returns 200',
  );
  assert(Array.isArray(listItems.data), 'Returns array');
  assert(listItems.data.length >= 2, 'Has at least 2 items');

  // Get by UUID
  const getItem = await api('GET', `/purchase-order-items/${item.uuid}`, token);
  assert(getItem.status === 200, 'GET /purchase-order-items/:uuid returns 200');

  // Update
  const patchItem = await api(
    'PATCH',
    `/purchase-order-items/${item.uuid}`,
    token,
    {
      quantityOrdered: 60,
      unitCost: '82.0000',
    },
  );
  assert(
    patchItem.status === 200,
    'PATCH /purchase-order-items/:uuid returns 200',
  );
  assert(patchItem.data.quantityOrdered === 60, 'Quantity updated');
  assert(patchItem.data.unitCost === '82.0000', 'Unit cost updated');

  // Delete
  const delItem = await api(
    'DELETE',
    `/purchase-order-items/${createItem2.data.uuid}`,
    token,
  );
  assert(
    delItem.status === 200,
    'DELETE /purchase-order-items/:uuid returns 200',
  );

  // ================================================================
  // VALIDATION
  // ================================================================
  console.log('\n--- Validation ---');

  const badSup = await api('POST', '/suppliers', token, {});
  assert(badSup.status === 400, 'POST /suppliers with empty body returns 400');

  const badPo = await api('POST', '/purchase-orders', token, {});
  assert(
    badPo.status === 400,
    'POST /purchase-orders with empty body returns 400',
  );

  const badItem = await api('POST', '/purchase-order-items', token, {});
  assert(
    badItem.status === 400,
    'POST /purchase-order-items with empty body returns 400',
  );

  // ================================================================
  // AUTH GUARD
  // ================================================================
  console.log('\n--- Auth guard ---');

  const noAuth = await fetch(`${API_BASE}/suppliers`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(noAuth.status === 401, 'GET /suppliers without token returns 401');

  const noAuthPo = await fetch(`${API_BASE}/purchase-orders`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(
    noAuthPo.status === 401,
    'GET /purchase-orders without token returns 401',
  );

  // ================================================================
  // ROLE-BASED ACCESS
  // ================================================================
  console.log('\n--- Role-based access ---');

  const cashierToken = await getAuthToken('CASHIER');
  const cashierSup = await api('GET', '/suppliers', cashierToken);
  assert(cashierSup.status === 403, 'CASHIER cannot read suppliers (403)');

  const warehouseToken = await getAuthToken('WAREHOUSE_STAFF');
  const whStaffSup = await api('POST', '/suppliers', warehouseToken, {
    name: `WH Staff Supplier ${Date.now()}`,
  });
  assert(whStaffSup.status === 201, 'WAREHOUSE_STAFF can create supplier');

  const whStaffDel = await api(
    'DELETE',
    `/suppliers/${whStaffSup.data.uuid}`,
    warehouseToken,
  );
  assert(
    whStaffDel.status === 403,
    'WAREHOUSE_STAFF cannot delete supplier (403)',
  );

  console.log('\n🎉 All Procurement tests passed!\n');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
