# HabeshaFreight Admin API Documentation

## Overview

The HabeshaFreight Admin API provides comprehensive administrative functionality for managing the freight marketplace platform. All endpoints are protected by JWT authentication and require the `ADMIN` role.

**Base Path:** `/api/admin`

**Authentication:** All endpoints require a valid Bearer JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Required Role:** `ADMIN`

**Database:** PostgreSQL with Knex

**Language:** TypeScript (strict mode)

**Total Endpoints:** 32 verified endpoints

## Security & Architecture

- **Authentication:** JWT-based authentication via the `authenticateToken` middleware (returns `401 Unauthorized` for missing, expired, invalid, or tampered tokens).
- **Authorization:** Role-based access control (RBAC) via the `authorizeRoles('ADMIN')` middleware (returns `403 Forbidden` for non-admin tokens).
- **Dedicated Role Changes:** User role updates are isolated to `PATCH /api/admin/users/:id/role` to prevent privilege escalation.
- **Last-Admin Protection:** Prevents demoting, suspending, or deactivating the final active administrator.
- **Sensitive Data Protection:** Passwords, password hashes, OTP codes, and tokens are strictly excluded from API responses. Updates containing prohibited fields return `400 Bad Request` with `PROHIBITED_FIELD`.
- **Database Transactions:** Multi-step mutations and audit logs run inside Knex database transactions (`dbClient.transaction`).
- **Audit Logging:** All sensitive administrative mutations record audit entries in the `audit_logs` table with actor IDs, actions, target types/IDs, and metadata. Audit records cannot be modified or deleted through the Admin API.
- **Validation:** All record IDs are validated as UUID (`INVALID_ID`).
- **SQL Injection Safeguards:** Pagination column sorting (`sortBy`) is validated against strict column allowlists per table.

## Response Format

All endpoints use a consistent response format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE"
  }
}
```

## HTTP Status Codes

- **200 OK:** Successful GET/PATCH request
- **201 Created:** Successful POST request
- **400 Bad Request:** Invalid input, UUID validation error, prohibited field, or last-admin protection trigger
- **401 Unauthorized:** Missing, expired, invalid, or tampered authentication token
- **403 Forbidden:** Authenticated user lacks `ADMIN` role
- **404 Not Found:** Resource does not exist
- **500 Internal Server Error:** Unexpected server error
- **501 Not Implemented:** Resource database table/schema is not configured

## Common Query Parameters

- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20, max: 100): Records per page
- `search` (string, optional): Search by text fields
- `sortBy` (string, optional): Field to sort by (validated against column allowlist)
- `sortOrder` (string, optional): 'asc' or 'desc' (default: 'desc')

## Common Error Codes

- `INVALID_ID`: Invalid or malformed UUID
- `USER_NOT_FOUND`: User resource does not exist
- `VEHICLE_NOT_FOUND`: Vehicle resource does not exist
- `LOAD_NOT_FOUND`: Load resource does not exist
- `SHIPMENT_NOT_FOUND`: Shipment resource does not exist
- `DISPUTE_NOT_FOUND`: Dispute resource does not exist
- `PROHIBITED_FIELD`: Attempt to modify a protected field
- `INVALID_ROLE`: Invalid role value provided
- `LAST_ADMIN_PROTECTION`: Operation blocked to prevent locking out the system's sole active admin
- `REJECTION_REASON_REQUIRED`: Rejection reason is mandatory
- `LOADS_NOT_CONFIGURED`: Loads table not configured in schema
- `SHIPMENTS_NOT_CONFIGURED`: Shipments table not configured in schema (501)
- `ESCROW_NOT_CONFIGURED`: Escrow table not configured in schema (501)
- `TRANSACTIONS_NOT_CONFIGURED`: Transactions table not configured in schema (501)
- `COMMISSIONS_NOT_CONFIGURED`: Commissions table not configured in schema (501)
- `DISPUTES_NOT_CONFIGURED`: Disputes table not configured in schema (501)
- `UNKNOWN_ERROR`: Unexpected server error

---

## Endpoint Details

### 1. Dashboard & Analytics

#### GET /api/admin/dashboard
Returns platform summary statistics.

**Response Example:**
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully.",
  "data": {
    "totalUsers": 150,
    "totalShippers": 45,
    "totalDrivers": 85,
    "totalFleetOwners": 20,
    "totalVehicles": 92,
    "totalLoads": 234,
    "pendingKyc": 12,
    "pendingVehicleVerification": 8,
    "activeShipments": "not configured - no shipments table found",
    "completedShipments": "not configured - no shipments table found",
    "activeDisputes": "not configured - no disputes table found",
    "escrowBalance": "not configured - no escrow table found"
  }
}
```

#### GET /api/admin/analytics
Query Parameters: `from`, `to` (ISO dates)  
Returns aggregate metrics across users, roles, and load statuses.

#### GET /api/admin/system-health
Returns component health status (API, Database, Redis, etc.).

---

### 2. User Management

#### GET /api/admin/users
List all users with pagination and filtering.  
Query: `page`, `limit`, `search`, `role`, `status`, `sortBy`, `sortOrder`

#### GET /api/admin/users/:id
Get user details by UUID. Passwords and OTP codes are sanitized.

#### PATCH /api/admin/users/:id
Update user profile fields (`full_name`, `email`, `phone_number`, `status`, `kyc_status`, `is_verified`).  
Attempting to submit prohibited fields (`password_hash`, `otp_code`, `role`, etc.) returns `400 Bad Request` with `PROHIBITED_FIELD`.  
**Audit Logged:** Yes (`USER_UPDATED`)

#### PATCH /api/admin/users/:id/role
Dedicated route for changing user role (`SHIPPER`, `DRIVER`, `FLEET_OWNER`, `ADMIN`).  
**Body:** `{ "role": "ADMIN" }`  
**Guards:** Demoting the last active administrator returns `400 Bad Request` with `LAST_ADMIN_PROTECTION`.  
**Audit Logged:** Yes (`ROLE_CHANGED`)

#### POST /api/admin/users/:id/suspend
Suspend a user account.  
**Guards:** Suspending the last active administrator returns `400 Bad Request` with `LAST_ADMIN_PROTECTION`.  
**Audit Logged:** Yes (`USER_SUSPENDED`)

#### POST /api/admin/users/:id/activate
Activate a suspended or inactive user account.  
**Audit Logged:** Yes (`USER_ACTIVATED`)

#### DELETE /api/admin/users/:id
Soft-delete a user account by setting `deleted_at` or `status: INACTIVE`. Physical deletion is avoided to preserve historical records.  
**Guards:** Deactivating the last active administrator returns `400 Bad Request` with `LAST_ADMIN_PROTECTION`.  
**Audit Logged:** Yes (`USER_DELETED`)

---

### 3. KYC Verification

#### GET /api/admin/kyc
List pending and reviewed KYC submissions.  
Query: `page`, `limit`, `status`, `role`

#### GET /api/admin/kyc/:id
Get user KYC details.

#### POST /api/admin/kyc/:id/approve
Approve KYC submission, setting `kyc_status: APPROVED` and `is_verified: true`.  
**Audit Logged:** Yes (`KYC_APPROVED`)

#### POST /api/admin/kyc/:id/reject
Reject KYC submission.  
**Body:** `{ "reason": "Unreadable document copy" }` (Required)  
**Audit Logged:** Yes (`KYC_REJECTED`)

---

### 4. Vehicle Management

#### GET /api/admin/vehicles
List registered vehicles. Query: `page`, `limit`, `search`, `verification`, `owner`, `vehicleType`

#### GET /api/admin/vehicles/:id
Get vehicle details by UUID.

#### POST /api/admin/vehicles/:id/verify
Verify vehicle documentation, updating `verification_status: VERIFIED`.  
**Audit Logged:** Yes (`VEHICLE_VERIFIED`)

#### POST /api/admin/vehicles/:id/reject
Reject vehicle documentation.  
**Body:** `{ "reason": "Expired insurance LIB" }`  
**Audit Logged:** Yes (`VEHICLE_REJECTED`)

---

### 5. Load Management

#### GET /api/admin/loads
List cargo loads. Query: `page`, `limit`, `status`, `origin`, `destination`, `shipper`, `from`, `to`

#### GET /api/admin/loads/:id
Get load details and associated bids.

#### PATCH /api/admin/loads/:id
Update load attributes (`status`, `cargo_description`, `weight_tons`, `origin_city`, `destination_city`, `offered_price_etb`).  
**Audit Logged:** Yes (`LOAD_UPDATED`)

---

### 6. Schema-Dependent Resources (501 Fallbacks)

When the underlying database tables (`shipments`, `escrow_ledger`, `transactions`, `commission_ledger`, `disputes`) are absent from the database schema, endpoints return **HTTP 501 Not Implemented** with resource-specific error codes:

#### Shipment Endpoints
- `GET /api/admin/shipments` -> 501 `SHIPMENTS_NOT_CONFIGURED`
- `GET /api/admin/shipments/:id` -> 501 `SHIPMENTS_NOT_CONFIGURED`
- `PATCH /api/admin/shipments/:id` -> 501 `SHIPMENTS_NOT_CONFIGURED`

#### Financial Ledger Endpoints
- `GET /api/admin/escrow` -> 501 `ESCROW_NOT_CONFIGURED`
- `GET /api/admin/transactions` -> 501 `TRANSACTIONS_NOT_CONFIGURED`
- `GET /api/admin/commissions` -> 501 `COMMISSIONS_NOT_CONFIGURED`

#### Dispute Resolution Endpoints
- `GET /api/admin/disputes` -> 501 `DISPUTES_NOT_CONFIGURED`
- `GET /api/admin/disputes/:id` -> 501 `DISPUTES_NOT_CONFIGURED`
- `POST /api/admin/disputes/:id/resolve` -> 501 `DISPUTES_NOT_CONFIGURED`
- `POST /api/admin/disputes/:id/reject` -> 501 `DISPUTES_NOT_CONFIGURED`

---

### 7. Audit Logging

#### GET /api/admin/audit-logs
Query Parameters: `page`, `limit`, `userId`, `action`, `sortBy`, `sortOrder`  
Returns audit log entries. Audit records cannot be modified or deleted through the Admin API.

**Audit Actions:**
- `USER_SUSPENDED`
- `USER_ACTIVATED`
- `USER_DELETED`
- `USER_UPDATED`
- `ROLE_CHANGED`
- `KYC_APPROVED`
- `KYC_REJECTED`
- `VEHICLE_VERIFIED`
- `VEHICLE_REJECTED`
- `LOAD_UPDATED`
- `SHIPMENT_UPDATED`
- `DISPUTE_RESOLVED`
- `DISPUTE_REJECTED`
- `ESCROW_REVIEWED`
- `COMMISSION_REVIEWED`

---

## Endpoint Summary (32 Endpoints)

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/api/admin/dashboard` | GET | Overview statistics |
| **Analytics** | `/api/admin/analytics` | GET | System metrics |
| **Health** | `/api/admin/system-health` | GET | Component status |
| **Users** | `/api/admin/users` | GET | List users |
| **Users** | `/api/admin/users/:id` | GET | User detail |
| **Users** | `/api/admin/users/:id` | PATCH | Update profile fields |
| **Users** | `/api/admin/users/:id/role` | PATCH | Change user role |
| **Users** | `/api/admin/users/:id/suspend` | POST | Suspend user account |
| **Users** | `/api/admin/users/:id/activate` | POST | Activate user account |
| **Users** | `/api/admin/users/:id` | DELETE | Soft-delete user account |
| **KYC** | `/api/admin/kyc` | GET | List KYC queue |
| **KYC** | `/api/admin/kyc/:id` | GET | KYC detail |
| **KYC** | `/api/admin/kyc/:id/approve` | POST | Approve KYC |
| **KYC** | `/api/admin/kyc/:id/reject` | POST | Reject KYC |
| **Vehicles** | `/api/admin/vehicles` | GET | List vehicles |
| **Vehicles** | `/api/admin/vehicles/:id` | GET | Vehicle detail |
| **Vehicles** | `/api/admin/vehicles/:id/verify` | POST | Verify vehicle |
| **Vehicles** | `/api/admin/vehicles/:id/reject` | POST | Reject vehicle |
| **Loads** | `/api/admin/loads` | GET | List loads |
| **Loads** | `/api/admin/loads/:id` | GET | Load detail |
| **Loads** | `/api/admin/loads/:id` | PATCH | Update load |
| **Shipments** | `/api/admin/shipments` | GET | List shipments (501 if missing) |
| **Shipments** | `/api/admin/shipments/:id` | GET | Shipment detail (501 if missing) |
| **Shipments** | `/api/admin/shipments/:id` | PATCH | Update shipment (501 if missing) |
| **Escrow** | `/api/admin/escrow` | GET | Escrow ledger (501 if missing) |
| **Transactions** | `/api/admin/transactions` | GET | Transactions (501 if missing) |
| **Commissions** | `/api/admin/commissions` | GET | Commission ledger (501 if missing) |
| **Disputes** | `/api/admin/disputes` | GET | List disputes (501 if missing) |
| **Disputes** | `/api/admin/disputes/:id` | GET | Dispute detail (501 if missing) |
| **Disputes** | `/api/admin/disputes/:id/resolve` | POST | Resolve dispute (501 if missing) |
| **Disputes** | `/api/admin/disputes/:id/reject` | POST | Reject dispute (501 if missing) |
| **Audit Logs** | `/api/admin/audit-logs` | GET | Retrieve audit logs |

---

Last Updated: August 15, 2026  
Version: 1.1.0  
Status: Verified & Production Ready
