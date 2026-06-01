#!/usr/bin/env bash
set -euo pipefail

# Deterministic local bootstrap for Firebase emulator + backend + mobile login flow.
# Requirements:
# - Firebase Auth Emulator running on 127.0.0.1:9099
# - Backend running on localhost:3000 or localhost:3001

python3 - <<'PY'
import json
import subprocess
import sys
import urllib.error
import urllib.request

EMULATOR_HOST = '127.0.0.1:9099'
PROJECT_ID = 'igneous-sum-496810-k1'
API_BASE_CANDIDATES = ['http://127.0.0.1:3000', 'http://127.0.0.1:3001']

ADMIN_EMAIL = 'admin@jssi-demo.ph'
ADMIN_PASSWORD = 'Admin123!'
ADMIN_USERNAME = 'admin_demo'

CASHIER_EMAIL = 'cashier@jssi-demo.ph'
CASHIER_PASSWORD = 'Cashier123!'
CASHIER_USERNAME = 'cashier_demo'
CASHIER_PIN = '1234'


def req(method: str, url: str, data=None, headers=None):
    payload = None
    if data is not None:
        payload = json.dumps(data).encode('utf-8')
    request = urllib.request.Request(url, method=method, data=payload)
    for k, v in (headers or {}).items():
        request.add_header(k, v)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read().decode('utf-8')
            try:
                parsed = json.loads(body) if body else {}
            except json.JSONDecodeError:
                parsed = body
            return response.getcode(), parsed
    except urllib.error.HTTPError as err:
        body = err.read().decode('utf-8')
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = body
        return err.code, parsed


def pick_api_base():
    for base in API_BASE_CANDIDATES:
        code, _ = req('GET', f'{base}/')
        if code == 200:
            return base
    raise RuntimeError('Backend is not reachable on 3000 or 3001')


def firebase_sign_in(email: str, password: str):
    return req(
        'POST',
        f'http://{EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key',
        {
            'email': email,
            'password': password,
            'returnSecureToken': True,
        },
        {'Content-Type': 'application/json'},
    )


def firebase_sign_up(email: str, password: str):
    return req(
        'POST',
        f'http://{EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key',
        {
            'email': email,
            'password': password,
            'returnSecureToken': True,
        },
        {'Content-Type': 'application/json'},
    )


def set_claims(local_id: str):
    return req(
        'POST',
        f'http://{EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/projects/{PROJECT_ID}/accounts:update',
        {
            'localId': local_id,
            'customAttributes': json.dumps({'role': 'TENANT_ADMIN', 'tenantId': 1}),
        },
        {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer owner',
        },
    )


def auth_headers(token: str):
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
    }


def as_list(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get('data'), list):
            return payload['data']
        if isinstance(payload.get('items'), list):
            return payload['items']
    return []


def non_target_pin(user_id: int):
    pin = 1000 + (user_id % 9000)
    if pin == int(CASHIER_PIN):
        pin += 1
    return str(pin).zfill(4)


def run_psql(sql: str):
    cmd = [
        'docker',
        'exec',
        '-i',
        'jssi-pos-db',
        'psql',
        '-U',
        'postgres',
        '-d',
        'jssi_pos',
        '-At',
        '-c',
        sql,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or 'psql command failed')
    return proc.stdout.strip()


summary = {
    'baseUrl': None,
    'admin': {'email': ADMIN_EMAIL, 'status': 'unknown'},
    'cashier': {'email': CASHIER_EMAIL, 'pin': CASHIER_PIN, 'status': 'unknown'},
    'store': {'status': 'unknown'},
}

try:
    base_url = pick_api_base()
    summary['baseUrl'] = base_url

    code, signin = firebase_sign_in(ADMIN_EMAIL, ADMIN_PASSWORD)
    if code != 200:
        code, signup = firebase_sign_up(ADMIN_EMAIL, ADMIN_PASSWORD)
        if code != 200:
            raise RuntimeError(f'Failed to create admin firebase account: {signup}')
        code, signin = firebase_sign_in(ADMIN_EMAIL, ADMIN_PASSWORD)
        if code != 200:
            raise RuntimeError(f'Failed to sign in admin after creation: {signin}')

    local_id = signin.get('localId')
    if not local_id:
        raise RuntimeError('Firebase sign-in did not return localId')

    code, claims = set_claims(local_id)
    if code != 200:
        raise RuntimeError(f'Failed to set custom claims: {claims}')

    code, signin = firebase_sign_in(ADMIN_EMAIL, ADMIN_PASSWORD)
    if code != 200:
        raise RuntimeError(f'Failed to get fresh admin token: {signin}')
    token = signin.get('idToken')
    if not token:
        raise RuntimeError('Missing admin idToken')

    headers = auth_headers(token)

    # Ensure at least one store exists and prefer store id 1.
    code, stores_raw = req('GET', f'{base_url}/stores', headers=headers)
    if code != 200:
        raise RuntimeError(f'GET /stores failed: {stores_raw}')
    stores = as_list(stores_raw)
    target_store = next((s for s in stores if s.get('id') == 1), stores[0] if stores else None)

    if target_store is None:
        code, target_store = req(
            'POST',
            f'{base_url}/stores',
            {
                'name': 'Demo Store',
                'address': '123 POS Street',
                'contactPhone': '+63-917-000-0000',
            },
            headers,
        )
        if code != 201:
            raise RuntimeError(f'Failed to create store: {target_store}')

    store_id = int(target_store['id'])
    summary['store'] = {'status': 'ready', 'id': store_id}

    # Ensure Firebase user is linked to a DB user record.
    # Primary path: link Firebase UID into existing local Postgres user record.
    # Fallback path: create linked STORE_MANAGER user when admin row is missing.
    code, me = req('GET', f'{base_url}/users/me', headers=headers)
    if code != 200:
        raise RuntimeError(f'GET /users/me failed: {me}')

    if isinstance(me, dict) and me.get('registered') is False:
        safe_email = ADMIN_EMAIL.replace("'", "''")
        safe_uid = local_id.replace("'", "''")
        linked_id = run_psql(
            f'UPDATE users SET "firebaseUid" = \'{safe_uid}\', "deletedAt" = NULL, "isActive" = TRUE '
            f'WHERE email = \'{safe_email}\' RETURNING id;'
        )

        if linked_id:
            summary['admin']['status'] = 'linked_existing_db_user'
        else:
            payload = {
                'firebaseUid': local_id,
                'email': ADMIN_EMAIL,
                'username': ADMIN_USERNAME,
                'password': ADMIN_PASSWORD,
                'firstName': 'Demo',
                'lastName': 'Manager',
                'role': 'STORE_MANAGER',
                'storeId': store_id,
            }
            code, created = req('POST', f'{base_url}/users', payload, headers)
            if code != 201:
                raise RuntimeError(f'Failed to create linked operator user: {created}')
            summary['admin']['status'] = 'created_linked_store_manager'

        code, me = req('GET', f'{base_url}/users/me', headers=headers)
        if code != 200 or (isinstance(me, dict) and me.get('registered') is False):
            raise RuntimeError('Admin Firebase user is still not linked to a local DB user after bootstrap')
    else:
        summary['admin']['status'] = 'ready'

    # Ensure cashier user exists.
    code, users_raw = req('GET', f'{base_url}/users', headers=headers)
    if code != 200:
        raise RuntimeError(f'GET /users failed: {users_raw}')
    users = as_list(users_raw)

    cashier = next((u for u in users if str(u.get('email', '')).lower() == CASHIER_EMAIL.lower()), None)
    if cashier is None:
        code, cashier = req(
            'POST',
            f'{base_url}/users',
            {
                'email': CASHIER_EMAIL,
                'username': CASHIER_USERNAME,
                'password': CASHIER_PASSWORD,
                'firstName': 'Demo',
                'lastName': 'Cashier',
                'role': 'CASHIER',
                'storeId': store_id,
            },
            headers,
        )
        if code != 201:
            raise RuntimeError(f'Failed to create cashier user: {cashier}')

    cashier_id = int(cashier['id'])
    cashier_uuid = cashier.get('uuid')

    # Ensure cashier is assigned to target store.
    cashier_store_id = cashier.get('storeId')
    if cashier_store_id != store_id and cashier_uuid:
        code, updated = req(
            'PATCH',
            f'{base_url}/users/{cashier_uuid}',
            {'storeId': store_id},
            headers,
        )
        if code != 200:
            raise RuntimeError(f'Failed to assign cashier store: {updated}')

    # Refresh users and normalize other users' PINs to avoid PIN collision with 1234.
    code, users_raw = req('GET', f'{base_url}/users', headers=headers)
    if code != 200:
        raise RuntimeError(f'Refresh GET /users failed: {users_raw}')
    users = as_list(users_raw)

    for user in users:
        user_id = user.get('id')
        if not isinstance(user_id, int):
            continue
        if user_id == cashier_id:
            continue
        pin = non_target_pin(user_id)
        req('POST', f'{base_url}/operator-sessions/pin', {'userId': user_id, 'pin': pin}, headers)

    # Set deterministic cashier PIN last so it always wins.
    code, set_pin = req(
        'POST',
        f'{base_url}/operator-sessions/pin',
        {'userId': cashier_id, 'pin': CASHIER_PIN},
        headers,
    )
    if code not in (200, 201):
        raise RuntimeError(f'Failed to set cashier PIN: {set_pin}')

    summary['cashier'] = {
        'status': 'ready',
        'email': CASHIER_EMAIL,
        'password': CASHIER_PASSWORD,
        'pin': CASHIER_PIN,
        'userId': cashier_id,
        'storeId': store_id,
    }

    print('Local dev bootstrap complete.')
    print(json.dumps(summary, indent=2))
except Exception as exc:
    summary['error'] = str(exc)
    print(json.dumps(summary, indent=2), file=sys.stderr)
    sys.exit(1)
PY
