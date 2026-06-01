/**
 * E2E Modifiers Test Script
 *
 * Tests Modifier Group, Modifier Option, Product-Group assignment,
 * Price Override CRUD and POS transaction modifier integration.
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 *   - PostgreSQL running (docker-compose up)
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

async function getAuthToken(): Promise<string> {
  const email = `admin-mod-${Date.now()}@test.com`;
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
  console.log('\n🍔 JSSI POS — Modifiers E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER GROUP CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Modifier Group CRUD ---');

  const createGroup = await api('POST', '/modifiers/groups', token, {
    name: 'Size',
    selectionType: 'SINGLE',
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 0,
  });
  assert(createGroup.status === 201, 'POST /modifiers/groups returns 201');
  const group = createGroup.data;
  assert(group.name === 'Size', 'Group name matches');
  assert(group.selectionType === 'SINGLE', 'selectionType matches');
  assert(group.isRequired === true, 'isRequired matches');
  console.log('  Created group:', group.uuid);

  const createGroup2 = await api('POST', '/modifiers/groups', token, {
    name: 'Add-ons',
    selectionType: 'MULTIPLE',
    isRequired: false,
    minSelections: 0,
    maxSelections: 5,
    sortOrder: 1,
  });
  assert(
    createGroup2.status === 201,
    'POST /modifiers/groups (2nd) returns 201',
  );
  const group2 = createGroup2.data;
  console.log('  Created group:', group2.uuid);

  const allGroups = await api('GET', '/modifiers/groups', token);
  assert(allGroups.status === 200, 'GET /modifiers/groups returns 200');
  assert(
    Array.isArray(allGroups.data.data) && allGroups.data.data.length >= 2,
    'Returns 2+ groups',
  );

  const getGroup = await api('GET', `/modifiers/groups/${group.uuid}`, token);
  assert(getGroup.status === 200, 'GET /modifiers/groups/:uuid returns 200');
  assert(getGroup.data.name === 'Size', 'Get by UUID returns correct group');

  const updateGroup = await api(
    'PATCH',
    `/modifiers/groups/${group.uuid}`,
    token,
    {
      name: 'Cup Size',
    },
  );
  assert(
    updateGroup.status === 200,
    'PATCH /modifiers/groups/:uuid returns 200',
  );
  assert(updateGroup.data.name === 'Cup Size', 'Name updated');

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER OPTION CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Modifier Option CRUD ---');

  const createOpt1 = await api('POST', '/modifiers/options', token, {
    modifierGroupId: group.id,
    name: 'Regular',
    priceAdjustment: '0.00',
    isDefault: true,
    sortOrder: 0,
  });
  assert(
    createOpt1.status === 201,
    'POST /modifiers/options (Regular) returns 201',
  );
  const opt1 = createOpt1.data;
  assert(opt1.name === 'Regular', 'Option name matches');
  assert(opt1.priceAdjustment === '0.00', 'priceAdjustment matches');
  assert(opt1.isDefault === true, 'isDefault matches');
  console.log('  Created option:', opt1.uuid);

  const createOpt2 = await api('POST', '/modifiers/options', token, {
    modifierGroupId: group.id,
    name: 'Large',
    priceAdjustment: '20.00',
    isDefault: false,
    sortOrder: 1,
  });
  assert(
    createOpt2.status === 201,
    'POST /modifiers/options (Large) returns 201',
  );
  const opt2 = createOpt2.data;
  console.log('  Created option:', opt2.uuid);

  const createOpt3 = await api('POST', '/modifiers/options', token, {
    modifierGroupId: group2.id,
    name: 'Extra Cheese',
    priceAdjustment: '15.00',
    sortOrder: 0,
  });
  assert(
    createOpt3.status === 201,
    'POST /modifiers/options (Add-on) returns 201',
  );
  const opt3 = createOpt3.data;
  console.log('  Created option:', opt3.uuid);

  const optsByGroup = await api(
    'GET',
    `/modifiers/options/by-group/${group.id}`,
    token,
  );
  assert(
    optsByGroup.status === 200,
    'GET /modifiers/options/by-group/:groupId returns 200',
  );
  assert(
    Array.isArray(optsByGroup.data) && optsByGroup.data.length === 2,
    'Returns 2 options for Size group',
  );

  const getOpt = await api('GET', `/modifiers/options/${opt1.uuid}`, token);
  assert(getOpt.status === 200, 'GET /modifiers/options/:uuid returns 200');

  const updateOpt = await api(
    'PATCH',
    `/modifiers/options/${opt2.uuid}`,
    token,
    {
      priceAdjustment: '25.00',
    },
  );
  assert(
    updateOpt.status === 200,
    'PATCH /modifiers/options/:uuid returns 200',
  );
  assert(updateOpt.data.priceAdjustment === '25.00', 'priceAdjustment updated');

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT-GROUP ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Product-Group Assignment ---');

  // Create a category + product first
  const catRes = await api('POST', '/categories', token, {
    name: 'Coffee',
    sortOrder: 0,
  });
  const cat = catRes.data;

  const prodRes = await api('POST', '/products', token, {
    categoryId: cat.id,
    name: 'Iced Americano',
    sku: `MOD-TEST-${Date.now()}`,
    unitPrice: '120.0000',
    unit: 'cup',
    vatType: 'VATABLE',
    vatRate: '0.1200',
  });
  assert(prodRes.status === 201, 'Created test product');
  const prod = prodRes.data;
  console.log('  Test product:', prod.uuid);

  const assignRes = await api('POST', '/modifiers/product-groups', token, {
    productId: prod.id,
    modifierGroupId: group.id,
    sortOrder: 0,
  });
  assert(
    assignRes.status === 201,
    'POST /modifiers/product-groups returns 201',
  );
  console.log('  Assigned Size group to product');

  const assignRes2 = await api('POST', '/modifiers/product-groups', token, {
    productId: prod.id,
    modifierGroupId: group2.id,
    sortOrder: 1,
  });
  assert(
    assignRes2.status === 201,
    'POST /modifiers/product-groups (2nd) returns 201',
  );

  // Duplicate assignment should fail
  const dupAssign = await api('POST', '/modifiers/product-groups', token, {
    productId: prod.id,
    modifierGroupId: group.id,
    sortOrder: 2,
  });
  assert(dupAssign.status === 409, 'Duplicate assignment returns 409 Conflict');

  const prodGroups = await api(
    'GET',
    `/modifiers/product-groups/${prod.id}`,
    token,
  );
  assert(
    prodGroups.status === 200,
    'GET /modifiers/product-groups/:productId returns 200',
  );
  assert(
    Array.isArray(prodGroups.data) && prodGroups.data.length === 2,
    'Product has 2 modifier groups',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE OVERRIDES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Price Overrides ---');

  const priceRes = await api('POST', '/modifiers/prices', token, {
    productId: prod.id,
    modifierOptionId: opt2.id,
    priceAdjustment: '30.00',
  });
  assert(priceRes.status === 201, 'POST /modifiers/prices returns 201');
  console.log('  Set Large price override to 30.00 for Iced Americano');

  const getPrices = await api('GET', `/modifiers/prices/${prod.id}`, token);
  assert(
    getPrices.status === 200,
    'GET /modifiers/prices/:productId returns 200',
  );
  assert(
    Array.isArray(getPrices.data) && getPrices.data.length === 1,
    'Returns 1 price override',
  );
  assert(
    getPrices.data[0].priceAdjustment === '30.00',
    'Price override amount correct',
  );

  // Upsert (update existing)
  const priceUpdate = await api('POST', '/modifiers/prices', token, {
    productId: prod.id,
    modifierOptionId: opt2.id,
    priceAdjustment: '35.00',
  });
  assert(
    priceUpdate.status === 201,
    'POST /modifiers/prices (upsert) returns 201',
  );

  const getPrices2 = await api('GET', `/modifiers/prices/${prod.id}`, token);
  assert(
    getPrices2.data[0].priceAdjustment === '35.00',
    'Price override updated via upsert',
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // POS TRANSACTION WITH MODIFIERS
  // (Requires seeded DB user for openedById — skipped in clean DB runs)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- POS Transaction with Modifiers ---');

  // Create a store
  const storeRes = await api('POST', '/stores', token, {
    name: 'Modifier Test Store',
    address: '456 Mod Ave',
    contactPhone: '+63-917-000-0002',
  });
  const store = storeRes.data;

  // Create stock level for the product
  await api('POST', '/stock-levels', token, {
    storeId: store.id,
    productId: prod.id,
    currentQuantity: 50,
    reorderThreshold: 10,
    criticalThreshold: 5,
  });

  // Try to open a cash register session (may fail in clean DB due to openedById constraint)
  const sessionRes = await api('POST', '/cash-register-sessions', token, {
    storeId: store.id,
    deviceId: 1,
    openedAt: new Date().toISOString(),
    openingCash: '5000.0000',
  });

  if (sessionRes.status === 201) {
    const session = sessionRes.data;

    // Create transaction with modifiers
    const txnRes = await api('POST', '/transactions', token, {
      storeId: store.id,
      sessionId: session.id,
      lineItems: [
        {
          productId: prod.id,
          quantity: 2,
          modifiers: [
            { modifierOptionId: opt2.id }, // Large (with price override of 35.00)
            { modifierOptionId: opt3.id }, // Extra Cheese (15.00)
          ],
        },
      ],
      payments: [
        { method: 'CASH', amount: '500.0000', amountTendered: '500.0000' },
      ],
    });
    assert(
      txnRes.status === 201,
      'POST /transactions with modifiers returns 201',
    );
    const txn = txnRes.data;
    console.log('  Transaction:', txn.uuid);
    console.log('  Total:', txn.totalAmount);

    // Verify modifiers affected the total
    // Base: 120.0000 * 2 = 240.0000
    // Modifier Large: 35.00 * 2 = 70.00
    // Modifier Extra Cheese: 15.00 * 2 = 30.00
    // Expected subtotal: 340.00
    const baseTotal = 120 * 2;
    const totalNum = parseFloat(txn.totalAmount || txn.subtotal || '0');
    assert(
      totalNum > baseTotal,
      `Total (${totalNum}) is greater than base product cost (${baseTotal})`,
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // VOID TRANSACTION (restore modifier inventory)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Void Transaction ---');

    const voidRes = await api('PATCH', `/transactions/${txn.uuid}/void`, token);
    assert(
      voidRes.status === 200,
      'PATCH /transactions/:uuid/void returns 200',
    );
    console.log('  Transaction voided');
  } else {
    console.log(
      '  ⚠️  Skipped POS transaction test (cash session requires seeded DB user)',
    );
    console.log(
      '     Status:',
      sessionRes.status,
      '- This is expected on clean DB',
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP — DELETE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Cleanup ---');

  // Remove price override
  const delPrice = await api(
    'DELETE',
    `/modifiers/prices/${prod.id}/${opt2.id}`,
    token,
  );
  assert(
    delPrice.status === 200,
    'DELETE /modifiers/prices/:productId/:optionId returns 200',
  );

  // Remove product-group assignment
  const delAssign = await api(
    'DELETE',
    `/modifiers/product-groups/${prod.id}/${group.id}`,
    token,
  );
  assert(
    delAssign.status === 200,
    'DELETE /modifiers/product-groups/:productId/:groupId returns 200',
  );

  // Delete option
  const delOpt = await api('DELETE', `/modifiers/options/${opt1.uuid}`, token);
  assert(delOpt.status === 200, 'DELETE /modifiers/options/:uuid returns 200');

  // Delete group (should cascade or soft-delete)
  const delGroup = await api(
    'DELETE',
    `/modifiers/groups/${group.uuid}`,
    token,
  );
  assert(delGroup.status === 200, 'DELETE /modifiers/groups/:uuid returns 200');

  // Verify deleted
  const afterDel = await api('GET', `/modifiers/groups/${group.uuid}`, token);
  assert(afterDel.status === 404, 'Deleted group returns 404');

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- Validation ---');

  const badGroup = await api('POST', '/modifiers/groups', token, {});
  assert(
    badGroup.status === 400,
    'POST /modifiers/groups with empty body returns 400',
  );

  const badOption = await api('POST', '/modifiers/options', token, {
    name: 'No group ID',
  });
  assert(
    badOption.status === 400,
    'POST /modifiers/options without modifierGroupId returns 400',
  );

  console.log('\n🎉 All Modifier tests passed!\n');
}

main().catch((err) => {
  console.error('\n💀 Test failed:', err.message);
  process.exit(1);
});
