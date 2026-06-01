# JSSI POS Integration App - Backend API Documentation

## Overview

NestJS 11 REST API with Firebase authentication, TypeORM + PostgreSQL, and tenant-scoped data isolation.

- Base URL (dev): `http://localhost:3000`
- Swagger UI: `/api/docs`
- Auth header: `Authorization: Bearer <firebase-id-token>`

This document is generated from current controller implementations under `apps/backend/src`.

---

## Authentication and Access Model

### Public Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/` | App root health/info route |
| GET | `/health` | App health route |
| GET | `/auth/health` | Auth health route |

### Authenticated-Only (No Explicit Role Decorator)

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/profile` | Current authenticated Firebase identity |
| POST | `/auth/register` | Self-service tenant + admin registration (requires valid Firebase token) |
| POST | `/devices` | Register device |
| GET | `/devices` | List caller devices |
| PATCH | `/devices/:uuid/deactivate` | Deactivate device |
| DELETE | `/devices/:uuid` | Delete device |
| POST | `/operator-sessions/switch` | PIN switch operator on device |
| DELETE | `/operator-sessions/:deviceUuid` | End operator session |
| GET | `/operator-sessions/device/:deviceUuid` | Get active operator for device |
| GET | `/operator-sessions` | List active sessions |

### Role Names

- Route decorators currently use: `TENANT_ADMIN`, `STORE_MANAGER`, `CASHIER`, `WAREHOUSE_STAFF`.
- Shared enum currently defines: `TENANT_ADMIN`, `STORE_MANAGER`, `CASHIER`, `WAREHOUSE_MANAGER`, `DRIVER`.
- Keep this mismatch in mind until role naming is unified in code.

### Permission Decorators in Use

| Permission | Where Used |
|---|---|
| `MANAGE_DISCOUNTS` | `POST /discounts`, `PATCH /discounts/:uuid` |

---

## Complete Endpoint Tables

## System

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| GET | `/` | Public | - | App root |
| GET | `/health` | Public | - | App health |

## Auth and Identity

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| GET | `/auth/health` | Public | - | Auth health |
| GET | `/auth/profile` | Any authenticated | - | Current Firebase claims |
| POST | `/auth/register` | Any authenticated | - | Register tenant + first admin |
| POST | `/tenants` | TENANT_ADMIN | - | Create tenant |
| GET | `/tenants` | TENANT_ADMIN | - | List tenants |
| GET | `/tenants/:uuid` | TENANT_ADMIN | - | Get tenant |
| PATCH | `/tenants/:uuid` | TENANT_ADMIN | - | Update tenant |
| DELETE | `/tenants/:uuid` | TENANT_ADMIN | - | Delete tenant |
| POST | `/users` | TENANT_ADMIN | - | Create user |
| GET | `/users` | TENANT_ADMIN, STORE_MANAGER | - | List users |
| GET | `/users/me` | Any authenticated | - | Get caller profile |
| GET | `/users/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Get user |
| PATCH | `/users/:uuid` | TENANT_ADMIN | - | Update user |
| PATCH | `/users/:uuid/deactivate` | TENANT_ADMIN | - | Deactivate user |
| DELETE | `/users/:uuid` | TENANT_ADMIN | - | Delete user |
| GET | `/users/:userId/permissions` | TENANT_ADMIN | - | List user permissions |
| PUT | `/users/:userId/permissions` | TENANT_ADMIN | - | Replace user permissions |
| POST | `/users/:userId/permissions` | TENANT_ADMIN | - | Grant permission |
| DELETE | `/users/:userId/permissions/:permission` | TENANT_ADMIN | - | Revoke permission |
| POST | `/devices` | Any authenticated | - | Register device |
| GET | `/devices` | Any authenticated | - | List devices |
| PATCH | `/devices/:uuid/deactivate` | Any authenticated | - | Deactivate device |
| DELETE | `/devices/:uuid` | Any authenticated | - | Delete device |
| POST | `/operator-sessions/pin` | TENANT_ADMIN, STORE_MANAGER | - | Set user PIN |
| DELETE | `/operator-sessions/pin/:userId` | TENANT_ADMIN, STORE_MANAGER | - | Remove user PIN |
| GET | `/operator-sessions/operators` | TENANT_ADMIN, STORE_MANAGER | - | List operators (optional `storeId`) |
| POST | `/operator-sessions/switch` | Any authenticated | - | Switch active operator |
| DELETE | `/operator-sessions/:deviceUuid` | Any authenticated | - | End device session |
| GET | `/operator-sessions/device/:deviceUuid` | Any authenticated | - | Get active operator by device |
| GET | `/operator-sessions` | Any authenticated | - | List active sessions |

## Inventory

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/categories` | TENANT_ADMIN | - | Create category |
| GET | `/categories` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | List categories |
| GET | `/categories/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | Get category |
| PATCH | `/categories/:uuid` | TENANT_ADMIN | - | Update category |
| DELETE | `/categories/:uuid` | TENANT_ADMIN | - | Delete category |
| POST | `/products` | TENANT_ADMIN | - | Create product |
| GET | `/products` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | List products |
| GET | `/products/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | Get product |
| PATCH | `/products/:uuid` | TENANT_ADMIN | - | Update product |
| DELETE | `/products/:uuid` | TENANT_ADMIN | - | Delete product |
| POST | `/stock-levels` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create stock level |
| GET | `/stock-levels` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | List stock levels |
| GET | `/stock-levels/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | Get stock level |
| PATCH | `/stock-levels/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update stock level |
| DELETE | `/stock-levels/:uuid` | TENANT_ADMIN | - | Delete stock level |
| POST | `/modifiers/groups` | TENANT_ADMIN, STORE_MANAGER | - | Create modifier group |
| GET | `/modifiers/groups` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List modifier groups |
| GET | `/modifiers/groups/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get modifier group |
| PATCH | `/modifiers/groups/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Update modifier group |
| DELETE | `/modifiers/groups/:uuid` | TENANT_ADMIN | - | Delete modifier group |
| POST | `/modifiers/options` | TENANT_ADMIN, STORE_MANAGER | - | Create modifier option |
| GET | `/modifiers/options/by-group/:groupId` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List options by group |
| GET | `/modifiers/options/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get modifier option |
| PATCH | `/modifiers/options/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Update modifier option |
| DELETE | `/modifiers/options/:uuid` | TENANT_ADMIN | - | Delete modifier option |
| POST | `/modifiers/product-groups` | TENANT_ADMIN, STORE_MANAGER | - | Assign group to product |
| GET | `/modifiers/product-groups/:productId` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List product groups |
| DELETE | `/modifiers/product-groups/:productId/:modifierGroupId` | TENANT_ADMIN, STORE_MANAGER | - | Remove group from product |
| POST | `/modifiers/prices` | TENANT_ADMIN, STORE_MANAGER | - | Set product modifier price override |
| GET | `/modifiers/prices/:productId` | TENANT_ADMIN, STORE_MANAGER | - | List modifier price overrides |
| DELETE | `/modifiers/prices/:productId/:modifierOptionId` | TENANT_ADMIN, STORE_MANAGER | - | Remove modifier price override |
| SSE | `/inventory/events` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF, CASHIER | - | Inventory event stream |

## POS

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/transactions` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Create transaction |
| GET | `/transactions` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List transactions |
| GET | `/transactions/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get transaction |
| PATCH | `/transactions/:uuid/void` | TENANT_ADMIN, STORE_MANAGER | - | Void transaction |
| GET | `/transactions/:uuid/line-items` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List line items |
| GET | `/transactions/:uuid/payments` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List payments |

## Cash Management

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/cash-register-sessions` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Open session |
| GET | `/cash-register-sessions` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List sessions |
| GET | `/cash-register-sessions/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get session |
| POST | `/cash-register-sessions/:uuid/close` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Close session |
| DELETE | `/cash-register-sessions/:uuid` | TENANT_ADMIN | - | Delete session |
| POST | `/cash-drawer-events` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Record event |
| GET | `/cash-drawer-events` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List events |
| GET | `/cash-drawer-events/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get event |
| DELETE | `/cash-drawer-events/:uuid` | TENANT_ADMIN | - | Delete event |

## Discounts

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/discounts` | TENANT_ADMIN, STORE_MANAGER | MANAGE_DISCOUNTS | Create discount |
| GET | `/discounts` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List discounts |
| GET | `/discounts/active` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List active discounts |
| GET | `/discounts/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get discount |
| GET | `/discounts/:uuid/history` | TENANT_ADMIN, STORE_MANAGER | - | Discount promo history |
| PATCH | `/discounts/:uuid` | TENANT_ADMIN, STORE_MANAGER | MANAGE_DISCOUNTS | Update discount |
| DELETE | `/discounts/:uuid` | TENANT_ADMIN | - | Delete discount |

## Customers

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/customers` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Create customer |
| GET | `/customers` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List customers |
| GET | `/customers/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get customer |
| PATCH | `/customers/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Update customer |
| DELETE | `/customers/:uuid` | TENANT_ADMIN | - | Delete customer |

## Compliance

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/receipts` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Create receipt |
| GET | `/receipts` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List receipts |
| GET | `/receipts/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get receipt |
| DELETE | `/receipts/:uuid` | TENANT_ADMIN | - | Delete receipt |
| POST | `/z-readings` | TENANT_ADMIN, STORE_MANAGER | - | Create Z-reading |
| GET | `/z-readings` | TENANT_ADMIN, STORE_MANAGER | - | List Z-readings |
| GET | `/z-readings/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Get Z-reading |
| DELETE | `/z-readings/:uuid` | TENANT_ADMIN | - | Delete Z-reading |
| POST | `/tax-configs` | TENANT_ADMIN | - | Create tax config |
| GET | `/tax-configs` | TENANT_ADMIN, STORE_MANAGER | - | List tax configs |
| GET | `/tax-configs/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Get tax config |
| PATCH | `/tax-configs/:uuid` | TENANT_ADMIN | - | Update tax config |
| DELETE | `/tax-configs/:uuid` | TENANT_ADMIN | - | Delete tax config |

## Returns

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/returns` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Create return |
| GET | `/returns` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List returns |
| GET | `/returns/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get return |
| GET | `/returns/:uuid/line-items` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List return line items |
| PATCH | `/returns/:uuid/approve` | TENANT_ADMIN, STORE_MANAGER | - | Approve return |
| PATCH | `/returns/:uuid/reject` | TENANT_ADMIN, STORE_MANAGER | - | Reject return |
| PATCH | `/returns/:uuid/complete` | TENANT_ADMIN, STORE_MANAGER | - | Complete return |
| DELETE | `/returns/:uuid` | TENANT_ADMIN | - | Delete return |

## Procurement

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/suppliers` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create supplier |
| GET | `/suppliers` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List suppliers |
| GET | `/suppliers/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get supplier |
| PATCH | `/suppliers/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update supplier |
| DELETE | `/suppliers/:uuid` | TENANT_ADMIN | - | Delete supplier |
| POST | `/purchase-orders` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create purchase order |
| GET | `/purchase-orders` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List purchase orders |
| GET | `/purchase-orders/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get purchase order |
| PATCH | `/purchase-orders/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update purchase order |
| DELETE | `/purchase-orders/:uuid` | TENANT_ADMIN | - | Delete purchase order |
| POST | `/purchase-order-items` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create purchase order item |
| GET | `/purchase-order-items` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List purchase order items |
| GET | `/purchase-order-items/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get purchase order item |
| PATCH | `/purchase-order-items/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update purchase order item |
| DELETE | `/purchase-order-items/:uuid` | TENANT_ADMIN | - | Delete purchase order item |

## Warehouse and Store Logistics

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/stores` | TENANT_ADMIN | - | Create store |
| GET | `/stores` | TENANT_ADMIN, STORE_MANAGER | - | List stores |
| GET | `/stores/:uuid` | TENANT_ADMIN, STORE_MANAGER | - | Get store |
| PATCH | `/stores/:uuid` | TENANT_ADMIN | - | Update store |
| DELETE | `/stores/:uuid` | TENANT_ADMIN | - | Delete store |
| POST | `/warehouses` | TENANT_ADMIN | - | Create warehouse |
| GET | `/warehouses` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List warehouses |
| GET | `/warehouses/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get warehouse |
| PATCH | `/warehouses/:uuid` | TENANT_ADMIN | - | Update warehouse |
| DELETE | `/warehouses/:uuid` | TENANT_ADMIN | - | Delete warehouse |
| POST | `/batches` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create batch |
| GET | `/batches` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List batches |
| GET | `/batches/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get batch |
| PATCH | `/batches/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update batch |
| DELETE | `/batches/:uuid` | TENANT_ADMIN | - | Delete batch |
| POST | `/dispatches` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create dispatch |
| GET | `/dispatches` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List dispatches |
| GET | `/dispatches/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get dispatch |
| PATCH | `/dispatches/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update dispatch |
| DELETE | `/dispatches/:uuid` | TENANT_ADMIN | - | Delete dispatch |
| POST | `/dispatch-items` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Create dispatch item |
| GET | `/dispatch-items` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List dispatch items |
| GET | `/dispatch-items/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get dispatch item |
| PATCH | `/dispatch-items/:uuid` | TENANT_ADMIN, WAREHOUSE_STAFF | - | Update dispatch item |
| DELETE | `/dispatch-items/:uuid` | TENANT_ADMIN | - | Delete dispatch item |
| POST | `/receiving-records` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Create receiving record |
| GET | `/receiving-records` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | List receiving records |
| GET | `/receiving-records/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Get receiving record |
| PATCH | `/receiving-records/:uuid` | TENANT_ADMIN, STORE_MANAGER, WAREHOUSE_STAFF | - | Update receiving record |
| DELETE | `/receiving-records/:uuid` | TENANT_ADMIN | - | Delete receiving record |

## Physical Inventory

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/stock-counts` | TENANT_ADMIN, STORE_MANAGER | - | Create stock count |
| GET | `/stock-counts` | TENANT_ADMIN, STORE_MANAGER | - | List stock counts |
| GET | `/stock-counts/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get stock count |
| PATCH | `/stock-counts/:uuid/items/:itemId` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Update counted item |
| POST | `/stock-counts/:uuid/complete` | TENANT_ADMIN, STORE_MANAGER | - | Complete stock count |
| POST | `/stock-counts/:uuid/approve` | TENANT_ADMIN | - | Approve stock count |
| POST | `/stock-counts/:uuid/cancel` | TENANT_ADMIN, STORE_MANAGER | - | Cancel stock count |

## Stock Audit

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/stock-movements` | TENANT_ADMIN, STORE_MANAGER | - | Record stock movement |
| GET | `/stock-movements` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List stock movements |
| GET | `/stock-movements/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get stock movement |

## Notifications

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| POST | `/notifications` | TENANT_ADMIN, STORE_MANAGER | - | Create notification |
| GET | `/notifications` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | List notifications |
| GET | `/notifications/:uuid` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Get notification |
| PATCH | `/notifications/:uuid/read` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Mark notification as read |
| PATCH | `/notifications/read-all` | TENANT_ADMIN, STORE_MANAGER, CASHIER | - | Mark all as read |
| DELETE | `/notifications/:uuid` | TENANT_ADMIN | - | Delete notification |

## Operation Logs

| Method | Path | Roles | Permission | Notes |
|---|---|---|---|---|
| GET | `/operation-logs` | TENANT_ADMIN, STORE_MANAGER | - | List operation logs |
| GET | `/operation-logs/:entityType/:entityId` | TENANT_ADMIN, STORE_MANAGER | - | List logs by entity |

---

## Notes

- Query params vary by controller DTO and service logic; see Swagger for exact request/response schemas.
- Monetary fields are generally stringified decimals in backend DTOs and entities.
- Multi-tenancy is server-side enforced via authenticated user context; clients do not pass tenantId in standard CRUD calls.
