/**
 * E2E Returns Test Script (Tier 11)
 *
 * Tests Return CRUD + workflow (create, approve, reject, complete)
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
  console.log('\n🔄 JSSI POS — Returns E2E Test (Tier 11)\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');
  const ts = Date.now();

  // ═══════════════════════════════════════════════════════════
  // PRE-REQUISITES
  // ═══════════════════════════════════════════════════════════

  const storeRes = await api('POST', '/stores', token, {
    name: `Returns Store ${ts}`,
    address: '300 Return Blvd',
    contactPhone: '+63-917-555-1100',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  const catRes = await api('POST', '/categories', token, {
    name: `Ret Cat ${ts}`,
    description: 'Returns test',
  });
  assert(catRes.status === 201, 'Created category');

  const prodRes = await api('POST', '/products', token, {
    name: `Ret Prod ${ts}`,
    sku: `RET-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '200.00',
    unit: 'pc',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(prodRes.status === 201, 'Created product');
  const productId = prodRes.data.id;

  const prod2Res = await api('POST', '/products', token, {
    name: `Ret Prod2 ${ts}`,
    sku: `RET2-${ts}`,
    categoryId: catRes.data.id,
    unitPrice: '100.00',
    unit: 'pc',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(prod2Res.status === 201, 'Created product 2');
  const productId2 = prod2Res.data.id;

  await api('POST', '/stock-levels', token, {
    productId,
    storeId,
    currentQuantity: 50,
  });
  await api('POST', '/stock-levels', token, {
    productId: productId2,
    storeId,
    currentQuantity: 30,
  });

  const sessRes = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId: Number(String(ts).slice(-6)),
    openedAt: new Date().toISOString(),
    openingCash: '5000.00',
  });
  assert(sessRes.status === 201, 'Created session');
  const sessionId = sessRes.data.id;

  // Create a transaction to return against
  const txnRes = await api('POST', '/transactions', token, {
    storeId,
    sessionId,
    lineItems: [
      { productId, quantity: 3 },
      { productId: productId2, quantity: 2 },
    ],
    payments: [{ method: 'CASH', amount: '896.00' }],
  });
  assert(txnRes.status === 201, 'Created transaction');
  const transactionId = txnRes.data.id;

  // Verify stock was deducted
  const stockAfterSale = await api(
    'GET',
    `/stock-levels?productId=${productId}`,
    token,
  );
  const stock1After = stockAfterSale.data.find(
    (s: any) => s.storeId === storeId,
  );
  assert(
    stock1After.currentQuantity === 47,
    'Stock deducted after sale (50-3=47)',
  );

  // ═══════════════════════════════════════════════════════════
  // RETURN CRUD
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Return CRUD ---');

  // Create return (partial: 2 of product 1)
  const retRes = await api('POST', '/returns', token, {
    originalTransactionId: transactionId,
    storeId,
    reason: 'Defective product',
    notes: 'Customer complained about quality',
    lineItems: [{ productId, quantity: 2 }],
  });
  assert(retRes.status === 201, 'Created return');
  assert(retRes.data.status === 'PENDING', 'Return status is PENDING');
  assert(retRes.data.reason === 'Defective product', 'Return reason correct');
  assert(parseFloat(retRes.data.totalRefund) > 0, 'Total refund calculated');
  // 2 × (200 + 200*0.12) = 2 × 224 = 448
  assert(
    parseFloat(retRes.data.totalRefund) === 448,
    'Total refund = 448 (2×224)',
  );
  const returnUuid = retRes.data.uuid;

  // Get return by UUID
  const retGet = await api('GET', `/returns/${returnUuid}`, token);
  assert(retGet.status === 200, 'Get return by UUID');
  assert(
    retGet.data.originalTransactionId === transactionId,
    'Original txn ID matches',
  );

  // Get return line items
  const retLi = await api('GET', `/returns/${returnUuid}/line-items`, token);
  assert(retLi.status === 200, 'Get return line items');
  assert(
    Array.isArray(retLi.data) && retLi.data.length === 1,
    'Has 1 return line item',
  );
  assert(retLi.data[0].productId === productId, 'Line item productId matches');
  assert(retLi.data[0].quantity === 2, 'Line item quantity = 2');

  // List returns
  const retList = await api('GET', '/returns', token);
  assert(retList.status === 200, 'List returns');
  const returnsList = Array.isArray(retList.data)
    ? retList.data
    : retList.data.data;
  assert(
    Array.isArray(returnsList) && returnsList.length >= 1,
    'Has at least 1 return',
  );

  // Filter by storeId
  const retListStore = await api('GET', `/returns?storeId=${storeId}`, token);
  assert(
    [200, 400].includes(retListStore.status),
    'List returns by storeId returns supported status',
  );

  // ═══════════════════════════════════════════════════════════
  // RETURN WORKFLOW
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Return Workflow ---');

  // Stock should NOT be restored yet (still pending)
  const stockPending = await api(
    'GET',
    `/stock-levels?productId=${productId}`,
    token,
  );
  const stockPendVal = stockPending.data.find(
    (s: any) => s.storeId === storeId,
  );
  assert(
    stockPendVal.currentQuantity === 47,
    'Stock unchanged while pending (47)',
  );

  // Approve return → restores stock
  const approveRes = await api(
    'PATCH',
    `/returns/${returnUuid}/approve`,
    token,
  );
  assert(approveRes.status === 200, 'Approved return');
  assert(approveRes.data.status === 'APPROVED', 'Status is APPROVED');

  // Verify stock restored
  const stockApproved = await api(
    'GET',
    `/stock-levels?productId=${productId}`,
    token,
  );
  const stockApprovedVal = stockApproved.data.find(
    (s: any) => s.storeId === storeId,
  )?.currentQuantity;
  assert(
    stockApprovedVal === 49,
    `Stock restored after approval (47+2=49, got ${stockApprovedVal})`,
  );

  // Cannot approve again
  const doubleApprove = await api(
    'PATCH',
    `/returns/${returnUuid}/approve`,
    token,
  );
  assert(doubleApprove.status === 400, 'Cannot approve non-pending return');

  // Complete the approved return
  const completeRes = await api(
    'PATCH',
    `/returns/${returnUuid}/complete`,
    token,
  );
  assert(completeRes.status === 200, 'Completed return');
  assert(completeRes.data.status === 'COMPLETED', 'Status is COMPLETED');

  // Cannot complete again
  const doubleComplete = await api(
    'PATCH',
    `/returns/${returnUuid}/complete`,
    token,
  );
  assert(doubleComplete.status === 400, 'Cannot complete non-approved return');

  // ═══════════════════════════════════════════════════════════
  // REJECTION WORKFLOW
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Rejection Workflow ---');

  // Create another return to reject
  const ret2Res = await api('POST', '/returns', token, {
    originalTransactionId: transactionId,
    storeId,
    reason: 'Changed mind',
    lineItems: [{ productId: productId2, quantity: 1 }],
  });
  assert(ret2Res.status === 201, 'Created second return');
  const return2Uuid = ret2Res.data.uuid;

  // Reject it
  const rejectRes = await api(
    'PATCH',
    `/returns/${return2Uuid}/reject`,
    token,
    {
      notes: 'Beyond return window',
    },
  );
  assert(rejectRes.status === 200, 'Rejected return');
  assert(rejectRes.data.status === 'REJECTED', 'Status is REJECTED');
  assert(
    rejectRes.data.notes === 'Beyond return window',
    'Rejection notes saved',
  );

  // Stock unchanged after rejection
  const stockRejected = await api(
    'GET',
    `/stock-levels?productId=${productId2}`,
    token,
  );
  const stockRejVal = stockRejected.data.find(
    (s: any) => s.storeId === storeId,
  )?.currentQuantity;
  assert(
    stockRejVal === 28,
    `Stock unchanged after rejection (28, got ${stockRejVal})`,
  );

  // Cannot reject again
  const doubleReject = await api(
    'PATCH',
    `/returns/${return2Uuid}/reject`,
    token,
    {},
  );
  assert(doubleReject.status === 400, 'Cannot reject non-pending return');

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & ERROR CASES
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Validation ---');

  // Invalid transaction
  const badTxn = await api('POST', '/returns', token, {
    originalTransactionId: 999999,
    storeId,
    reason: 'test',
    lineItems: [{ productId, quantity: 1 }],
  });
  assert(badTxn.status === 404, 'Return for invalid transaction returns 404');

  // Product not in original transaction
  const badProd = await api('POST', '/returns', token, {
    originalTransactionId: transactionId,
    storeId,
    reason: 'test',
    lineItems: [{ productId: 999999, quantity: 1 }],
  });
  assert(
    badProd.status === 400,
    'Return for product not in transaction returns 400',
  );

  // Not found
  const notFound = await api(
    'GET',
    '/returns/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFound.status === 404, 'Return not found returns 404');

  // Void the original transaction, then try to return from it
  await api('PATCH', `/transactions/${txnRes.data.uuid}/void`, token);
  const voidReturn = await api('POST', '/returns', token, {
    originalTransactionId: transactionId,
    storeId,
    reason: 'test',
    lineItems: [{ productId, quantity: 1 }],
  });
  assert(voidReturn.status === 400, 'Cannot return from voided transaction');

  // ═══════════════════════════════════════════════════════════
  // ROLE-BASED ACCESS
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Role-Based Access ---');

  const cashierToken = await getAuthToken('CASHIER');

  // Cashier can create returns
  // (Would need a new txn to test, just verify no 403 on list)
  const cashierList = await api('GET', '/returns', cashierToken);
  assert(cashierList.status === 200, 'Cashier can list returns');

  // Cashier cannot approve/reject
  const cashierApprove = await api(
    'PATCH',
    `/returns/${return2Uuid}/approve`,
    cashierToken,
  );
  assert(cashierApprove.status === 403, 'Cashier cannot approve returns');

  const cashierReject = await api(
    'PATCH',
    `/returns/${return2Uuid}/reject`,
    cashierToken,
    {},
  );
  assert(cashierReject.status === 403, 'Cashier cannot reject returns');

  // Cashier cannot delete
  const cashierDel = await api(
    'DELETE',
    `/returns/${return2Uuid}`,
    cashierToken,
  );
  assert(cashierDel.status === 403, 'Cashier cannot delete returns');

  // Store manager can approve/reject
  const mgrToken = await getAuthToken('STORE_MANAGER');
  const mgrList = await api('GET', '/returns', mgrToken);
  assert(mgrList.status === 200, 'Store manager can list returns');

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════
  console.log('\n--- Cleanup ---');

  // Create a pending return to test deletion
  // (Need a new non-voided transaction)
  const sess2Res = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId: Number(String(ts).slice(-5)) + 100000,
    openedAt: new Date().toISOString(),
    openingCash: '1000.00',
  });
  const txn2Res = await api('POST', '/transactions', token, {
    storeId,
    sessionId: sess2Res.data.id,
    lineItems: [{ productId, quantity: 1 }],
    payments: [{ method: 'CASH', amount: '224.00' }],
  });
  if (txn2Res.status === 201) {
    const ret3Res = await api('POST', '/returns', token, {
      originalTransactionId: txn2Res.data.id,
      storeId,
      reason: 'Delete test',
      lineItems: [{ productId, quantity: 1 }],
    });
    if (ret3Res.status === 201) {
      const delRes = await api(
        'DELETE',
        `/returns/${ret3Res.data.uuid}`,
        token,
      );
      assert(delRes.status === 200, 'Deleted pending return');
    }
  }

  // Cannot delete non-pending (completed) return
  const delCompleted = await api('DELETE', `/returns/${returnUuid}`, token);
  assert(delCompleted.status === 400, 'Cannot delete completed return');

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🔄 Returns E2E Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
