/**
 * E2E Notifications Test Script (Tier 13)
 *
 * Tests Notification CRUD + mark as read
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
  console.log('\n🔔 JSSI POS — Notifications E2E Test (Tier 13)\n');

  const token = await getAuthToken();
  assert(!!token, 'Got auth token');

  console.log('--- Create Notifications ---');
  const n1 = await api('POST', '/notifications', token, {
    userId: 1,
    type: 'LOW_STOCK',
    channel: 'IN_APP',
    title: 'Low Stock Alert',
    message: 'Product X is running low (5 remaining)',
  });
  assert(n1.status === 201, 'Created notification 1 (LOW_STOCK)');
  assert(n1.data.type === 'LOW_STOCK', 'Type correct');
  assert(n1.data.channel === 'IN_APP', 'Channel correct');
  assert(n1.data.isRead === false, 'Default isRead = false');
  assert(!!n1.data.uuid, 'Has UUID');
  const uuid1 = n1.data.uuid;

  const n2 = await api('POST', '/notifications', token, {
    userId: 1,
    type: 'EXPIRY_WARNING',
    channel: 'IN_APP',
    title: 'Expiry Warning',
    message: 'Batch B-001 expires in 7 days',
  });
  assert(n2.status === 201, 'Created notification 2 (EXPIRY_WARNING)');
  const uuid2 = n2.data.uuid;

  const n3 = await api('POST', '/notifications', token, {
    storeId: 1,
    type: 'SYSTEM',
    channel: 'IN_APP',
    title: 'System Update',
    message: 'Scheduled maintenance at 2am',
  });
  assert(n3.status === 201, 'Created notification 3 (SYSTEM, store-scoped)');
  assert(n3.data.userId === null, 'userId is null for store notification');
  assert(n3.data.storeId === 1, 'storeId set');

  console.log('\n--- Query Notifications ---');
  const all = await api('GET', '/notifications', token);
  assert(all.status === 200, 'List all notifications');
  assert(Array.isArray(all.data.data), 'Returns paginated data array');
  assert(all.data.data.length >= 3, 'Has at least 3 notifications');
  assert(all.data.meta.total >= 3, 'Meta total correct');

  // Filter by userId
  const byUser = await api('GET', '/notifications?userId=1', token);
  assert(byUser.status === 200, 'Filter by userId');
  assert(byUser.data.data.length >= 2, 'Has user notifications');

  // Filter by storeId
  const byStore = await api('GET', '/notifications?storeId=1', token);
  assert(byStore.status === 200, 'Filter by storeId');
  assert(byStore.data.data.length >= 1, 'Has store notifications');

  // Filter by isRead
  const unread = await api('GET', '/notifications?isRead=false', token);
  assert(unread.status === 200, 'Filter by isRead=false');
  assert(unread.data.data.length >= 3, 'All unread');

  // Get by UUID
  const byUuid = await api('GET', `/notifications/${uuid1}`, token);
  assert(byUuid.status === 200, 'Get by UUID');
  assert(byUuid.data.title === 'Low Stock Alert', 'Title matches');

  // Not found
  const notFound = await api(
    'GET',
    '/notifications/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(notFound.status === 404, 'Not found returns 404');

  console.log('\n--- Mark as Read ---');
  const readRes = await api('PATCH', `/notifications/${uuid1}/read`, token);
  assert(readRes.status === 200, 'Marked as read');
  assert(readRes.data.isRead === true, 'isRead = true');

  // Verify filter works
  const readFiltered = await api('GET', '/notifications?isRead=true', token);
  assert(
    readFiltered.data.data.some((n: any) => n.uuid === uuid1),
    'Shows in read filter',
  );

  // Mark all as read
  const markAll = await api('PATCH', '/notifications/read-all', token);
  assert(markAll.status === 200, 'Mark all as read');

  // Verify all user notifications are read
  const afterMarkAll = await api(
    'GET',
    '/notifications?userId=1&isRead=false',
    token,
  );
  assert(
    afterMarkAll.data.data.length === 0,
    'No unread notifications for user',
  );

  console.log('\n--- Delete ---');
  const del = await api('DELETE', `/notifications/${uuid2}`, token);
  assert(del.status === 200, 'Deleted notification');
  assert(del.data.deleted === true, 'Deleted response');

  // Verify deleted
  const afterDel = await api('GET', `/notifications/${uuid2}`, token);
  assert(afterDel.status === 404, 'Deleted notification returns 404');

  // Delete not found
  const delNotFound = await api(
    'DELETE',
    '/notifications/00000000-0000-0000-0000-000000000000',
    token,
  );
  assert(delNotFound.status === 404, 'Delete not found returns 404');

  console.log('\n--- Role-Based Access ---');
  const cashierToken = await getAuthToken('CASHIER', { userId: 2 });

  // Cashier can read
  const cashierRead = await api('GET', '/notifications', cashierToken);
  assert(cashierRead.status === 200, 'Cashier can list notifications');

  // Cashier can mark as read
  const cashierMark = await api(
    'PATCH',
    `/notifications/${uuid1}/read`,
    cashierToken,
  );
  assert(cashierMark.status === 200, 'Cashier can mark as read');

  // Cashier cannot create
  const cashierCreate = await api('POST', '/notifications', cashierToken, {
    userId: 2,
    type: 'SYSTEM',
    channel: 'IN_APP',
    title: 'Test',
    message: 'test',
  });
  assert(cashierCreate.status === 403, 'Cashier cannot create notifications');

  // Cashier cannot delete
  const cashierDel = await api(
    'DELETE',
    `/notifications/${uuid1}`,
    cashierToken,
  );
  assert(cashierDel.status === 403, 'Cashier cannot delete notifications');

  // Store manager can create
  const managerToken = await getAuthToken('STORE_MANAGER', { userId: 3 });
  const managerCreate = await api('POST', '/notifications', managerToken, {
    userId: 3,
    type: 'DISPATCH_UPDATE',
    channel: 'IN_APP',
    title: 'Dispatch',
    message: 'Dispatch arrived',
  });
  assert(
    managerCreate.status === 201,
    'Store manager can create notifications',
  );

  // Store manager cannot delete
  const managerDel = await api(
    'DELETE',
    `/notifications/${uuid1}`,
    managerToken,
  );
  assert(
    managerDel.status === 403,
    'Store manager cannot delete notifications',
  );

  console.log('\n--- Validation ---');
  // Missing required fields
  const invalid = await api('POST', '/notifications', token, {
    title: 'Incomplete',
  });
  assert(invalid.status === 400, 'Validation rejects incomplete notification');

  // Invalid type
  const badType = await api('POST', '/notifications', token, {
    type: 'INVALID_TYPE',
    channel: 'IN_APP',
    title: 'Bad',
    message: 'bad',
  });
  assert(badType.status === 400, 'Validation rejects invalid type');

  // Invalid channel
  const badChannel = await api('POST', '/notifications', token, {
    type: 'SYSTEM',
    channel: 'INVALID',
    title: 'Bad',
    message: 'bad',
  });
  assert(badChannel.status === 400, 'Validation rejects invalid channel');

  console.log('\n--- Auto-Trigger: Low Stock ---');
  // Create a product with reorderPoint, stock it, then deduct below threshold
  const storeRes = await api('POST', '/stores', token, {
    name: `Notif Store ${Date.now()}`,
    address: '1 St',
    contactPhone: '+63-917-555-0001',
  });
  const trigStoreId = storeRes.data.id;
  const catRes = await api('POST', '/categories', token, {
    name: `Cat ${Date.now()}`,
  });
  const trigProd = await api('POST', '/products', token, {
    name: `Egg ${Date.now()}`,
    sku: `EGG-${Date.now()}`,
    categoryId: catRes.data.id,
    unitPrice: '10.00',
    unit: 'pc',
    vatType: 'VATABLE',
    vatRate: '0.1200',
    reorderPoint: 5,
  });
  assert(trigProd.status === 201, 'Created product with reorderPoint=5');

  // Set initial stock at 8
  await api('POST', '/stock-levels', token, {
    storeId: trigStoreId,
    productId: trigProd.data.id,
    currentQuantity: 8,
  });

  // Deduct stock to below reorderPoint (8-4=4, which is <= 5)
  const movement = await api('POST', '/stock-movements', token, {
    storeId: trigStoreId,
    productId: trigProd.data.id,
    movementType: 'ADJUSTMENT',
    quantityChange: -4,
    notes: 'Trigger test',
  });
  assert(movement.status === 201, 'Created negative adjustment (8→4)');

  // Check that a LOW_STOCK notification was auto-created
  const autoNotifs = await api(
    'GET',
    `/notifications?storeId=${trigStoreId}`,
    token,
  );
  const lowStockNotif = autoNotifs.data.data.find(
    (n: any) => n.type === 'LOW_STOCK' && n.storeId === trigStoreId,
  );
  assert(!!lowStockNotif, 'Auto-triggered LOW_STOCK notification created');
  assert(
    lowStockNotif.title === 'Low Stock Alert',
    'Low stock notification title correct',
  );
  assert(
    lowStockNotif.message.includes('4 remaining'),
    'Message shows current stock',
  );

  console.log('\n--- WebSocket Real-Time Delivery ---');
  // Connect a socket.io client and verify real-time push
  const { io } = await import('socket.io-client');
  const socket = io('http://localhost:3000/notifications', {
    query: { userId: '1', storeId: String(trigStoreId) },
    transports: ['websocket'],
  });

  const wsNotification = await new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('WebSocket timeout')),
      5000,
    );
    socket.on('notification', (data: any) => {
      clearTimeout(timeout);
      resolve(data);
    });
    socket.on('connect', async () => {
      // Create a notification after socket connects
      await api('POST', '/notifications', token, {
        userId: 1,
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'WebSocket Test',
        message: 'Real-time delivery test',
      });
    });
  }).catch((e) => e.message);

  socket.disconnect();

  if (typeof wsNotification === 'string') {
    assert(false, `WebSocket notification received (${wsNotification})`);
  } else {
    assert(
      wsNotification.title === 'WebSocket Test',
      'WebSocket notification title correct',
    );
    assert(
      wsNotification.message === 'Real-time delivery test',
      'WebSocket notification message correct',
    );
    assert(
      wsNotification.type === 'SYSTEM',
      'WebSocket notification type correct',
    );
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(
    `🔔 Notifications E2E Results: ${passed} passed, ${failed} failed`,
  );
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
