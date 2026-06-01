/**
 * E2E Cash Management Test Script
 *
 * Tests CashRegisterSession and CashDrawerEvent CRUD
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
  console.log('\n💰 JSSI POS — Cash Management E2E Test\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  const ts = Date.now();

  // === PRE-REQUISITES ===
  // Create a store for the session
  const storeRes = await api('POST', '/stores', token, {
    name: `Cash Mgmt Store ${ts}`,
    address: '100 Cash Ave',
    contactPhone: '+63-917-555-0800',
  });
  assert(storeRes.status === 201, 'Created store');
  const storeId = storeRes.data.id;

  // Use a per-run deviceId so repeated test runs do not clash with existing open sessions
  const deviceId = Number(String(ts).slice(-6));

  // ================================================================
  // CASH REGISTER SESSION CRUD
  // ================================================================
  console.log('\n--- Cash Register Session ---');

  // Create session
  const createSession = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId,
    openedAt: new Date().toISOString(),
    openingCash: '5000.0000',
    notes: 'Morning shift opening',
  });
  assert(
    createSession.status === 201,
    'POST /cash-register-sessions returns 201',
  );
  const session = createSession.data;
  assert(session.storeId === storeId, 'Session storeId matches');
  assert(session.deviceId === deviceId, 'Session deviceId matches');
  assert(session.openingCash === '5000.0000', 'Opening cash matches');
  assert(session.status === 'OPEN', 'Session status is OPEN');
  assert(session.openedById === 1, 'openedById matches userId from claims');
  assert(!!session.uuid, 'Session has UUID');
  assert(session.tenantId === 1, 'Session tenantId matches');
  console.log('  Created session:', session.uuid);

  // Create second session
  const createSession2 = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId: deviceId + 1,
    openedAt: new Date().toISOString(),
    openingCash: '3000.0000',
  });
  assert(createSession2.status === 201, 'Created second session');

  // List all sessions
  const listAll = await api('GET', '/cash-register-sessions', token);
  assert(listAll.status === 200, 'GET /cash-register-sessions returns 200');
  const allSessions = Array.isArray(listAll.data)
    ? listAll.data
    : listAll.data.data;
  assert(Array.isArray(allSessions), 'Returns session list payload');
  assert(allSessions.length >= 2, 'At least 2 sessions returned');

  // List by store (open only)
  const listByStore = await api(
    'GET',
    `/cash-register-sessions?storeId=${storeId}`,
    token,
  );
  assert(listByStore.status === 200, 'GET with storeId filter returns 200');
  assert(listByStore.data.length >= 2, 'Both open sessions for store returned');

  // Get by UUID
  const getOne = await api(
    'GET',
    `/cash-register-sessions/${session.uuid}`,
    token,
  );
  assert(
    getOne.status === 200,
    'GET /cash-register-sessions/:uuid returns 200',
  );
  assert(getOne.data.uuid === session.uuid, 'UUID matches');
  assert(getOne.data.openingCash === '5000.0000', 'Data matches on get');

  // Close session
  const closeRes = await api(
    'POST',
    `/cash-register-sessions/${session.uuid}/close`,
    token,
    {
      actualCash: '5250.0000',
      notes: 'End of morning shift',
    },
  );
  assert(closeRes.status === 201, 'POST /close returns 201');
  assert(
    closeRes.data.status === 'CLOSED',
    'Session status is CLOSED after close',
  );
  assert(closeRes.data.actualCash === '5250.0000', 'Actual cash recorded');
  assert(closeRes.data.closedById === 1, 'closedById matches');
  assert(closeRes.data.closedAt !== null, 'closedAt is set');

  // Cannot close already closed session
  const closeAgain = await api(
    'POST',
    `/cash-register-sessions/${session.uuid}/close`,
    token,
    {
      actualCash: '5000.0000',
    },
  );
  assert(
    closeAgain.status === 400,
    'Cannot close already-closed session (400)',
  );

  // Verify storeId filter excludes closed
  const listOpenAfterClose = await api(
    'GET',
    `/cash-register-sessions?storeId=${storeId}`,
    token,
  );
  assert(
    listOpenAfterClose.data.length >= 1,
    'Store filter still returns open sessions',
  );

  // Validation: missing required fields
  const badCreate = await api('POST', '/cash-register-sessions', token, {});
  assert(badCreate.status === 400, 'Validation fails with empty body (400)');

  // Validation: invalid openingCash
  const badCash = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId,
    openedAt: new Date().toISOString(),
    openingCash: 'not-a-number',
  });
  assert(badCash.status === 400, 'Validation fails with invalid decimal (400)');

  // Not found
  const notFound = await api(
    'GET',
    '/cash-register-sessions/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFound.status === 404, 'Returns 404 for nonexistent session');

  // Auth guard: no token
  const noAuth = await fetch(`${API_BASE}/cash-register-sessions`, {
    method: 'GET',
  });
  assert(noAuth.status === 401, 'GET without token returns 401');

  // Role guard: DRIVER cannot access
  const driverToken = await getAuthToken('DRIVER');
  const driverAccess = await api('GET', '/cash-register-sessions', driverToken);
  assert(driverAccess.status === 403, 'DRIVER role returns 403');

  // CASHIER can access
  const cashierToken = await getAuthToken('CASHIER');
  const cashierAccess = await api(
    'GET',
    '/cash-register-sessions',
    cashierToken,
  );
  assert(cashierAccess.status === 200, 'CASHIER role can list sessions');

  // CASHIER cannot delete
  const cashierDelete = await api(
    'DELETE',
    `/cash-register-sessions/${createSession2.data.uuid}`,
    cashierToken,
  );
  assert(cashierDelete.status === 403, 'CASHIER cannot delete sessions (403)');

  // TENANT_ADMIN can delete (soft)
  const deleteRes = await api(
    'DELETE',
    `/cash-register-sessions/${createSession2.data.uuid}`,
    token,
  );
  assert(
    deleteRes.status === 200,
    'DELETE /cash-register-sessions/:uuid returns 200',
  );

  // Verify deleted session not found
  const afterDelete = await api(
    'GET',
    `/cash-register-sessions/${createSession2.data.uuid}`,
    token,
  );
  assert(afterDelete.status === 404, 'Deleted session returns 404');

  // ================================================================
  // CASH DRAWER EVENTS
  // ================================================================
  console.log('\n--- Cash Drawer Events ---');

  // Need an open session for events
  const openSession = await api('POST', '/cash-register-sessions', token, {
    storeId,
    deviceId,
    openedAt: new Date().toISOString(),
    openingCash: '2000.0000',
  });
  assert(openSession.status === 201, 'Created open session for events');
  const eventSessionUuid = openSession.data.uuid;

  // Create CASH_IN event
  const createCashIn = await api('POST', '/cash-drawer-events', token, {
    sessionUuid: eventSessionUuid,
    type: 'CASH_IN',
    amount: '500.0000',
    reason: 'Float addition',
  });
  assert(
    createCashIn.status === 201,
    'POST /cash-drawer-events CASH_IN returns 201',
  );
  const cashInEvent = createCashIn.data;
  assert(cashInEvent.type === 'CASH_IN', 'Event type is CASH_IN');
  assert(cashInEvent.amount === '500.0000', 'Amount matches');
  assert(cashInEvent.reason === 'Float addition', 'Reason matches');
  assert(cashInEvent.performedById === 1, 'performedById matches');
  assert(cashInEvent.tenantId === 1, 'Event tenantId matches');
  console.log('  Created CASH_IN event:', cashInEvent.uuid);

  // Create CASH_OUT event
  const createCashOut = await api('POST', '/cash-drawer-events', token, {
    sessionUuid: eventSessionUuid,
    type: 'CASH_OUT',
    amount: '200.0000',
    reason: 'Petty cash withdrawal',
  });
  assert(
    createCashOut.status === 201,
    'POST /cash-drawer-events CASH_OUT returns 201',
  );
  const cashOutEvent = createCashOut.data;
  assert(cashOutEvent.type === 'CASH_OUT', 'Event type is CASH_OUT');
  assert(cashOutEvent.amount === '200.0000', 'Amount matches');
  console.log('  Created CASH_OUT event:', cashOutEvent.uuid);

  // Create additional events
  const extraEvent = await api('POST', '/cash-drawer-events', token, {
    sessionUuid: eventSessionUuid,
    type: 'CASH_IN',
    amount: '100.0000',
    reason: 'Change replenishment',
  });
  assert(extraEvent.status === 201, 'Created extra event');

  // List events by session
  const listEvents = await api(
    'GET',
    `/cash-drawer-events?sessionUuid=${eventSessionUuid}`,
    token,
  );
  assert(
    listEvents.status === 200,
    'GET /cash-drawer-events?sessionUuid returns 200',
  );
  assert(Array.isArray(listEvents.data), 'Returns array');
  assert(listEvents.data.length === 3, 'All 3 events returned');

  // List without sessionUuid returns 400
  const noSessionParam = await api('GET', '/cash-drawer-events', token);
  assert(noSessionParam.status === 400, 'GET without sessionUuid returns 400');

  // Get single event
  const getEvent = await api(
    'GET',
    `/cash-drawer-events/${cashInEvent.uuid}`,
    token,
  );
  assert(getEvent.status === 200, 'GET /cash-drawer-events/:uuid returns 200');
  assert(getEvent.data.uuid === cashInEvent.uuid, 'Event UUID matches');
  assert(getEvent.data.reason === 'Float addition', 'Event data correct');

  // Validation: missing required fields
  const badEvent = await api('POST', '/cash-drawer-events', token, {});
  assert(badEvent.status === 400, 'Validation fails with empty body (400)');

  // Validation: invalid enum
  const badEnum = await api('POST', '/cash-drawer-events', token, {
    sessionUuid: eventSessionUuid,
    type: 'INVALID_TYPE',
    amount: '100.0000',
    reason: 'test',
  });
  assert(badEnum.status === 400, 'Validation fails with invalid enum (400)');

  // Validation: invalid sessionUuid (not found)
  const badSessionRef = await api('POST', '/cash-drawer-events', token, {
    sessionUuid: '00000000-0000-0000-0000-000000000000',
    type: 'CASH_IN',
    amount: '100.0000',
    reason: 'test',
  });
  assert(
    badSessionRef.status === 404,
    'Returns 404 for nonexistent session reference',
  );

  // Not found event
  const notFoundEvent = await api(
    'GET',
    '/cash-drawer-events/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFoundEvent.status === 404, 'Returns 404 for nonexistent event');

  // Auth guard: no token
  const noAuthEvent = await fetch(
    `${API_BASE}/cash-drawer-events?sessionUuid=${eventSessionUuid}`,
    {
      method: 'GET',
    },
  );
  assert(noAuthEvent.status === 401, 'GET events without token returns 401');

  // Role guard: DRIVER cannot access
  const driverEvents = await api(
    'GET',
    `/cash-drawer-events?sessionUuid=${eventSessionUuid}`,
    driverToken,
  );
  assert(driverEvents.status === 403, 'DRIVER cannot access events (403)');

  // CASHIER can create events
  const cashierEvent = await api('POST', '/cash-drawer-events', cashierToken, {
    sessionUuid: eventSessionUuid,
    type: 'CASH_IN',
    amount: '50.0000',
    reason: 'Cashier adding float',
  });
  assert(cashierEvent.status === 201, 'CASHIER can create events');

  // CASHIER cannot delete events
  const cashierDeleteEvent = await api(
    'DELETE',
    `/cash-drawer-events/${cashInEvent.uuid}`,
    cashierToken,
  );
  assert(
    cashierDeleteEvent.status === 403,
    'CASHIER cannot delete events (403)',
  );

  // TENANT_ADMIN can delete (soft)
  const deleteEvent = await api(
    'DELETE',
    `/cash-drawer-events/${extraEvent.data.uuid}`,
    token,
  );
  assert(
    deleteEvent.status === 200,
    'DELETE /cash-drawer-events/:uuid returns 200',
  );

  // Verify deleted event not found
  const afterDeleteEvent = await api(
    'GET',
    `/cash-drawer-events/${extraEvent.data.uuid}`,
    token,
  );
  assert(afterDeleteEvent.status === 404, 'Deleted event returns 404');

  // Verify list count decreased
  const listAfterDelete = await api(
    'GET',
    `/cash-drawer-events?sessionUuid=${eventSessionUuid}`,
    token,
  );
  assert(
    listAfterDelete.data.length === 3,
    'Event count reflects deletion (3 remaining: 2 original + cashier)',
  );

  // ================================================================
  console.log('\n🎉 All Cash Management E2E tests passed!\n');
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
