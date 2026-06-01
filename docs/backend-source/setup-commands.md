# JSSI POS — Setup Commands Log

All commands run from the project root:
`/Users/codes/Programming Projects/JSSI/POS Integration App`

## 1. Cleaned up manually written files

```bash
rm -rf packages/ package.json turbo.json .env.example docker-compose.yml .gitignore
rm -rf backend/
```

## 2. Scaffolded Turborepo monorepo

```bash
npx create-turbo@latest /tmp/jssi-turbo-temp --skip-install
# Selected: npm as package manager
```

Turborepo can't scaffold into a non-empty directory, so it was created in `/tmp` and the root config files were copied over:

```bash
cp /tmp/jssi-turbo-temp/package.json .
cp /tmp/jssi-turbo-temp/turbo.json .
cp /tmp/jssi-turbo-temp/.gitignore .
cp /tmp/jssi-turbo-temp/.npmrc .
mkdir -p apps packages
```

The example apps (`apps/docs`, `apps/web`) and packages (`packages/eslint-config`, `packages/typescript-config`, `packages/ui`) from the Turborepo template were **not** copied — only the root config.

Renamed the workspace in `package.json` from `"jssi-turbo-temp"` to `"jssi-pos"`.

## 3. Scaffolded NestJS backend inside apps/

```bash
cd apps
npx @nestjs/cli new backend --skip-git --strict --package-manager npm
```

This created `apps/backend/` with:
- `package.json` (NestJS deps, scripts)
- `tsconfig.json`, `tsconfig.build.json`
- `nest-cli.json`
- `eslint.config.mjs`, `.prettierrc`
- `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`
- `test/jest-e2e.json`, `test/app.e2e-spec.ts`
- `node_modules/` (npm install ran automatically by nest CLI)

## 4. Installed workspace dependencies from root

```bash
npm install
```

## 5. Verified Turborepo sees the backend

```bash
npx turbo run build --dry
# Output: Packages in scope: backend (apps/backend)
```

## 6. Verified no axios

```bash
grep -r "axios" apps/backend/package.json
ls apps/backend/node_modules/axios
```

Both confirmed clean — no axios anywhere.

## 7. Added `dev` script alias to backend package.json

NestJS uses `start:dev` but Turborepo's `turbo.json` expects a `dev` task. Added `"dev": "nest start --watch"` to `apps/backend/package.json` scripts.

## 8. Verified hello world endpoint

```bash
npx turbo run dev --filter=backend
# In another terminal:
curl http://localhost:3000
# Output: Hello World!
```

## 9. Generated auth module

```bash
cd apps/backend
npx nest g module auth
npx nest g controller auth --no-spec
npx nest g service auth --no-spec
```

Created `src/auth/auth.module.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`.
NestJS CLI auto-registered `AuthModule` in `src/app.module.ts`.

## 10. Installed Firebase Admin SDK

```bash
cd apps/backend
npm install firebase-admin
```

Verified no axios pulled in as transitive dependency.

## 11. Generated Firebase module and auth guards

```bash
cd apps/backend
npx nest g module firebase
npx nest g service firebase --no-spec
npx nest g guard auth/guards/firebase-auth --no-spec --flat
npx nest g guard auth/guards/roles --no-spec --flat
```

Manually created (no CLI generators for decorators):
- `src/auth/decorators/public.decorator.ts` — `@Public()` to skip auth on endpoints
- `src/auth/decorators/roles.decorator.ts` — `@Roles('ADMIN')` for RBAC
- `src/auth/decorators/current-user.decorator.ts` — `@CurrentUser()` param decorator

Manually wired:
- `FirebaseService` — initializes Firebase Admin SDK, exposes `auth` getter
- `FirebaseModule` — marked `@Global()`, exports `FirebaseService`
- `FirebaseAuthGuard` — extracts Bearer token, verifies via `firebase-admin`, attaches decoded user to request, respects `@Public()`
- `RolesGuard` — reads `@Roles()` metadata, checks `user.role` from Firebase custom claims
- `AuthModule` — registers both guards globally via `APP_GUARD`
- `AuthController` — `GET /auth/health` (public), `GET /auth/profile` (protected)
- `AppController` — marked `@Public()` on hello world endpoint

## 12. Verified auth endpoints

```bash
curl http://localhost:3000                          # 200 Hello World!
curl http://localhost:3000/auth/health              # 200 {"status":"ok"}
curl http://localhost:3000/auth/profile             # 401 Unauthorized
curl -H "Authorization: Bearer fake" .../profile   # 401 Invalid token
```

## 13. Added Firebase credentials to .gitignore and .env.example

Added to root `.gitignore`:
```
*-service-account*.json
firebase-*.json
```

Created `apps/backend/.env.example` with `GOOGLE_APPLICATION_CREDENTIALS` for local dev.
On Cloud Run, ADC is automatic — no env var or JSON file needed.

## 14. Added auth tests

Created test files:
- `src/auth/auth.controller.spec.ts` — health + profile endpoint tests
- `src/auth/guards/firebase-auth.guard.spec.ts` — public bypass, missing/bad/invalid/valid token tests
- `src/auth/guards/roles.guard.spec.ts` — no roles, matching role, wrong role, missing role tests

```bash
cd apps/backend
npx jest --verbose
# 4 suites, 13 tests, all passing
```

## 15. Cleanup

```bash
rm -rf /tmp/jssi-turbo-temp
```
