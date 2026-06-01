/**
 * Mobile Shift Bootstrap E2E
 *
 * Validates the exact mobile bootstrap path:
 * 1) Admin/device bootstrap
 * 2) Operator PIN switch on device
 * 3) Open cash register session with X-Device-UUID context
 * 4) Create a transaction under that session
 * 5) Close the session
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

type ApiResponse = { status: number; data: any };

async function getAuthToken(
  role = 'TENANT_ADMIN',
  extra: Record<string, unknown> = {},
) {
  const email = `mobile-bootstrap-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
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
        customAttributes: JSON.stringify({ role, tenantId: 1, ...extra }),
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

  return { token: signIn.idToken, firebaseUid: signUp.localId, email };
}

async function api(
  method: string,
  path: string,
  token: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(headers ?? {}),
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

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failed++;
    return;
  }
  console.log(`PASS: ${message}`);
  passed++;
}

async function main() {
  console.log('\nMobile Shift Bootstrap E2E\n');

  const ts = Date.now();
  const testPin = String(ts).slice(-4).padStart(4, '0');
  const { token, firebaseUid, email } = await getAuthToken('TENANT_ADMIN');
  assert(!!token, 'Admin token acquired');

  const createLinkedUser = await api('POST', '/users', token, {
    firebaseUid,
    email,
    username: `mgr_${ts}`,
    password: 'StrongPass123!',
    firstName: 'Mobile',
    lastName: 'Manager',
    role: 'STORE_MANAGER',
  });
  assert(
    createLinkedUser.status === 201,
    `Firebase-linked user created for token lookup (got ${createLinkedUser.status}: ${JSON.stringify(createLinkedUser.data)})`,
  );

  const storeRes = await api('POST', '/stores', token, {
    name: `Mobile Store ${ts}`,
    address: '123 POS Street',
    contactPhone: '+63-917-555-7777',
  });
  assert(storeRes.status === 201, `Store created (got ${storeRes.status})`);
  const storeId = storeRes.data.id as number;

  const cashierRes = await api('POST', '/users', token, {
    email: `cashier_${ts}@test.com`,
    username: `cashier_${ts}`,
    password: 'StrongPass123!',
    firstName: 'Shift',
    lastName: 'Cashier',
    role: 'CASHIER',
    storeId,
  });
  assert(
    cashierRes.status === 201,
    `Cashier user created (got ${cashierRes.status})`,
  );
  const cashierId = cashierRes.data.id as number;

  const setPinRes = await api('POST', '/operator-sessions/pin', token, {
    userId: cashierId,
    pin: testPin,
  });
  assert(
    [200, 201].includes(setPinRes.status),
    `Cashier PIN set (got ${setPinRes.status}: ${JSON.stringify(setPinRes.data)})`,
  );

  const deviceFingerprint = `00000000-0000-4000-8000-${String(ts).slice(-12)}`;
  const registerDevice = await api('POST', '/devices', token, {
    deviceFingerprint,
    platform: 'ANDROID',
    deviceName: 'Mobile POS QA Device',
  });
  assert(
    registerDevice.status === 201,
    `Device registered (got ${registerDevice.status}: ${JSON.stringify(registerDevice.data)})`,
  );

  const myDevices = await api('GET', '/devices', token);
  assert(
    myDevices.status === 200,
    `Fetched my devices (got ${myDevices.status})`,
  );
  const devices = Array.isArray(myDevices.data) ? myDevices.data : [];
  const targetDevice = devices.find(
    (d: any) => d.deviceFingerprint === deviceFingerprint,
  );
  assert(
    !!targetDevice,
    'Device fingerprint resolved to a UUID in my device list',
  );
  const deviceUuid = targetDevice?.uuid as string;

  const switchRes = await api('POST', '/operator-sessions/switch', token, {
    deviceUuid,
    pin: testPin,
  });
  assert(
    switchRes.status === 201 || switchRes.status === 200,
    `Operator session switched via PIN (got ${switchRes.status}: ${JSON.stringify(switchRes.data)})`,
  );
  assert(
    switchRes.data?.operator?.id === cashierId,
    'Switched operator matches cashier',
  );

  const header = { 'X-Device-UUID': deviceUuid };

  const sessionRes = await api(
    'POST',
    '/cash-register-sessions',
    token,
    {
      storeId,
      deviceId: Number(String(ts).slice(-6)),
      openedAt: new Date().toISOString(),
      openingCash: '5000.00',
    },
    header,
  );
  assert(
    sessionRes.status === 201,
    `Cash register session opened with operator context (got ${sessionRes.status}: ${JSON.stringify(sessionRes.data)})`,
  );
  const sessionId = sessionRes.data.id as number;
  const sessionUuid = sessionRes.data.uuid as string;
  assert(!!sessionId && !!sessionUuid, 'Session id/uuid returned');

  const categoryRes = await api('POST', '/categories', token, {
    name: `MobileCat-${ts}`,
  });
  assert(
    categoryRes.status === 201,
    `Category created (got ${categoryRes.status})`,
  );

  const productRes = await api('POST', '/products', token, {
    name: `MobileProd-${ts}`,
    sku: `MOB-${ts}`,
    categoryId: categoryRes.data.id,
    unitPrice: '120.00',
    unit: 'pc',
    vatType: 'VATABLE',
    vatRate: '12.0000',
  });
  assert(
    productRes.status === 201,
    `Product created (got ${productRes.status})`,
  );
  const productId = productRes.data.id as number;

  const stockRes = await api('POST', '/stock-levels', token, {
    productId,
    storeId,
    currentQuantity: 50,
  });
  assert(
    stockRes.status === 201,
    `Stock level created (got ${stockRes.status})`,
  );

  const txnRes = await api(
    'POST',
    '/transactions',
    token,
    {
      storeId,
      sessionId,
      lineItems: [{ productId, quantity: 1 }],
      // Product price is VAT-inclusive. Use full payable amount to avoid insufficient-payment rejection.
      payments: [{ method: 'CASH', amount: '134.40' }],
    },
    header,
  );
  assert(
    txnRes.status === 201,
    `Transaction created under active shift session (got ${txnRes.status}: ${JSON.stringify(txnRes.data)})`,
  );

  const closeRes = await api(
    'POST',
    `/cash-register-sessions/${sessionUuid}/close`,
    token,
    {
      actualCash: '5120.00',
    },
    header,
  );
  assert(
    [200, 201].includes(closeRes.status),
    `Cash register session closed (got ${closeRes.status}: ${JSON.stringify(closeRes.data)})`,
  );
  assert(closeRes.data.status === 'CLOSED', 'Closed session status is CLOSED');

  const activeOperator = await api(
    'GET',
    `/operator-sessions/device/${deviceUuid}`,
    token,
  );
  assert(
    activeOperator.status === 200,
    `Active operator lookup works (got ${activeOperator.status}: ${JSON.stringify(activeOperator.data)})`,
  );
  assert(
    activeOperator.data?.operator?.id === cashierId,
    'Active operator remains cashier after close',
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
