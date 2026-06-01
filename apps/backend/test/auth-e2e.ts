/**
 * E2E Auth Test Script
 *
 * Tests the full auth flow using Firebase Auth Emulator:
 * 1. Creates a user in the emulator
 * 2. Gets a custom token and exchanges it for an ID token
 * 3. Tests protected endpoints with the token
 *
 * Prerequisites:
 *   - Firebase Auth Emulator running on port 9099
 *   - NestJS server running on port 3000
 *   - FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 in .env
 *
 * Run:
 *   npx firebase emulators:start --only auth &
 *   npm run start:dev &
 *   npx ts-node test/auth-e2e.ts
 */

const EMULATOR_HOST = '127.0.0.1:9099';
const API_BASE = 'http://localhost:3000';
const PROJECT_ID = 'igneous-sum-496810-k1';

interface EmulatorSignUpResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
}

async function createEmulatorUser(
  email: string,
  password: string,
): Promise<EmulatorSignUpResponse> {
  const url = `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create user: ${err}`);
  }
  return res.json() as Promise<EmulatorSignUpResponse>;
}

async function signIn(
  email: string,
  password: string,
): Promise<EmulatorSignUpResponse> {
  const url = `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to sign in: ${err}`);
  }
  return res.json() as Promise<EmulatorSignUpResponse>;
}

async function setCustomClaims(
  uid: string,
  claims: Record<string, unknown>,
): Promise<void> {
  const url = `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer owner',
    },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify(claims),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to set claims: ${err}`);
  }
}

async function apiCall(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
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
  console.log('\n🔥 JSSI POS — Auth E2E Test\n');
  console.log(`Emulator: ${EMULATOR_HOST}`);
  console.log(`API: ${API_BASE}\n`);

  // Test 1: Public endpoint works without auth
  console.log('--- Test 1: Public endpoints ---');
  const health = await apiCall('GET', '/auth/health');
  assert(health.status === 200, 'GET /auth/health returns 200');

  const root = await apiCall('GET', '/');
  assert(root.status === 200, 'GET / returns 200');

  // Test 2: Protected endpoint rejects without auth
  console.log('\n--- Test 2: Auth guard rejects unauthenticated ---');
  const noAuth = await apiCall('GET', '/tenants');
  assert(noAuth.status === 401, 'GET /tenants without token returns 401');

  const noAuthUsers = await apiCall('GET', '/users');
  assert(noAuthUsers.status === 401, 'GET /users without token returns 401');

  // Test 3: Create a user in emulator and get token
  console.log('\n--- Test 3: Firebase Emulator user creation ---');
  const email = `admin-${Date.now()}@test.com`;
  const password = 'TestPass123!';

  const signUpResult = await createEmulatorUser(email, password);
  assert(!!signUpResult.idToken, `User created in emulator: ${email}`);
  assert(!!signUpResult.localId, `Got Firebase UID: ${signUpResult.localId}`);

  // Set custom claims (TENANT_ADMIN role)
  await setCustomClaims(signUpResult.localId, {
    role: 'TENANT_ADMIN',
    tenantId: 1,
  });

  // Re-sign in to get token with claims
  const signInResult = await signIn(email, password);
  let token = signInResult.idToken;
  assert(!!token, 'Got fresh ID token with claims');

  // Test 4: Authenticated request succeeds
  console.log('\n--- Test 4: Authenticated requests ---');
  const profile = await apiCall('GET', '/auth/profile', token);
  assert(profile.status === 200, 'GET /auth/profile returns 200 with token');
  console.log('  Profile:', JSON.stringify(profile.data, null, 2));

  // Test 5: Create a tenant
  console.log('\n--- Test 5: Tenant CRUD ---');
  const createTenant = await apiCall('POST', '/tenants', token, {
    name: 'Test Tenant',
    businessName: 'Test Business Corp.',
    tin: '123-456-789-000',
    address: '123 Test Street, Manila',
    contactEmail: 'test@tenant.com',
    contactPhone: '+63-917-123-4567',
  });
  assert(createTenant.status === 201, `POST /tenants returns 201`);
  console.log('  Created tenant:', JSON.stringify(createTenant.data, null, 2));

  const tenantData = createTenant.data as { id: number; uuid: string };

  // Rebind claims to the tenant that was just created, then re-sign in.
  await setCustomClaims(signUpResult.localId, {
    role: 'TENANT_ADMIN',
    tenantId: tenantData.id,
  });
  const tenantScopedSignIn = await signIn(email, password);
  token = tenantScopedSignIn.idToken;
  assert(!!token, 'Got tenant-scoped ID token after tenant creation');

  // Get all tenants
  const allTenants = await apiCall('GET', '/tenants', token);
  assert(allTenants.status === 200, 'GET /tenants returns 200');
  assert(Array.isArray(allTenants.data), 'Returns array of tenants');

  // Get single tenant by UUID
  const singleTenant = await apiCall(
    'GET',
    `/tenants/${tenantData.uuid}`,
    token,
  );
  assert(
    singleTenant.status === 200,
    `GET /tenants/${tenantData.uuid} returns 200`,
  );

  // Update tenant
  const updatedTenant = await apiCall(
    'PATCH',
    `/tenants/${tenantData.uuid}`,
    token,
    {
      name: 'Updated Tenant Name',
    },
  );
  assert(updatedTenant.status === 200, 'PATCH /tenants/:uuid returns 200');
  assert(
    (updatedTenant.data as { name: string }).name === 'Updated Tenant Name',
    'Tenant name was updated',
  );

  // Test 6: Create a user
  console.log('\n--- Test 6: User CRUD ---');
  const staffEmail = `cashier-${Date.now()}@test.com`;
  const staffUsername = `cashier_${Date.now()}`;
  const createUser = await apiCall('POST', '/users', token, {
    email: staffEmail,
    username: staffUsername,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Cashier',
    role: 'CASHIER',
  });
  assert(createUser.status === 201, `POST /users returns 201`);
  console.log('  Created user:', JSON.stringify(createUser.data, null, 2));

  // Get /users/me
  const me = await apiCall('GET', '/users/me', token);
  assert(me.status === 200, 'GET /users/me returns 200');

  // Test 7: Validation errors
  console.log('\n--- Test 7: Validation ---');
  const badTenant = await apiCall('POST', '/tenants', token, {
    name: 'X',
    // Missing required fields
  });
  assert(
    badTenant.status === 400,
    'POST /tenants with missing fields returns 400',
  );

  // Test 8: Delete tenant (soft delete)
  console.log('\n--- Test 8: Soft delete ---');
  const deleteTenant = await apiCall(
    'DELETE',
    `/tenants/${tenantData.uuid}`,
    token,
  );
  assert(deleteTenant.status === 200, 'DELETE /tenants/:uuid returns 200');

  // Verify it's gone from list
  const afterDelete = await apiCall('GET', '/tenants', token);
  const remainingTenants = afterDelete.data as { uuid: string }[];
  const stillExists = remainingTenants.some((t) => t.uuid === tenantData.uuid);
  assert(!stillExists, 'Soft-deleted tenant no longer in list');

  console.log('\n🎉 All tests passed!\n');
}

main().catch((err) => {
  console.error('\n💀 Test failed:', err.message);
  process.exit(1);
});
