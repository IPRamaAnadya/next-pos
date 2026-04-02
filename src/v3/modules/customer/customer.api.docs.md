# Customer API — V3

Base URL: `/api/v3/customers`

All responses follow the standard envelope:

```json
{
  "meta": { "message": "string", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

---

## Authorization

All endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Both `owner` and `staff` tokens have full access to all customer endpoints.

---

## Data Shape: `CustomerProfile`

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "membershipCode": "MBR-001",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "address": "Jl. Contoh No. 1",
  "birthday": "1990-05-15T00:00:00.000Z",
  "lastPurchaseAt": "2026-03-28T10:00:00.000Z",
  "membershipExpiredAt": "2027-01-01T00:00:00.000Z",
  "points": 150,
  "isMember": true,
  "isActiveMember": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-04-02T00:00:00.000Z"
}
```

| Field | Notes |
|---|---|
| `isMember` | Computed: `true` if `membershipCode` is set |
| `isActiveMember` | Computed: member AND (`membershipExpiredAt` is null OR in the future) |
| `points` | Loyalty points balance |

---

## Endpoints

### 1. List Customers

```
GET /api/v3/customers
```

Returns a paginated list of customers for the current tenant.

**Query parameters**

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | |
| `pageSize` | number | `20` | Max `100` |
| `search` | string | — | Searches name and phone (case-insensitive) |
| `email` | string | — | Filter by email (partial match) |
| `phone` | string | — | Filter by phone (partial match) |
| `membershipCode` | string | — | Filter by membership code (partial match) |
| `hasActiveMembership` | boolean | — | `true` = active members only; `false` = non-members / expired |

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": [ { "...CustomerProfile..." } ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 2. Create Customer

```
POST /api/v3/customers
```

Creates a new customer under the current tenant.

**Request body**

```json
{
  "name": "Budi Santoso",
  "membershipCode": "MBR-001",
  "email": "budi@example.com",
  "phone": "081234567890",
  "address": "Jl. Contoh No. 1",
  "birthday": "1990-05-15",
  "membershipExpiredAt": "2027-01-01T00:00:00.000Z",
  "points": 0
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `membershipCode` | string | ❌ | Must be unique across the tenant |
| `email` | string | ❌ | Must be unique across the tenant |
| `phone` | string | ❌ | Must be unique across the tenant |
| `address` | string | ❌ | |
| `birthday` | ISO date string | ❌ | |
| `membershipExpiredAt` | ISO date string | ❌ | Must be a future date |
| `points` | integer | ❌ | Default `0`; must be ≥ 0 |

**Response `200`**
```json
{
  "meta": { "message": "Customer created successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...CustomerProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` missing; duplicate email/phone/membershipCode; `membershipExpiredAt` is in the past; `points` < 0 |
| `401` | Missing or invalid token |

---

### 3. Get Active Members Count

```
GET /api/v3/customers/active-members
```

Returns the count of customers with an active membership (has membershipCode AND expiry is null or in the future).

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": { "count": 18 },
  "pagination": null
}
```

---

### 4. Get Customer

```
GET /api/v3/customers/:customerId
```

Returns a single customer by ID.

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": { "...CustomerProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Customer not found or belongs to another tenant |

---

### 5. Update Customer

```
PUT /api/v3/customers/:customerId
```

Updates a customer. All fields are optional; only provided fields are changed.

**Request body**

```json
{
  "name": "Budi Santoso Jr.",
  "phone": "089876543210",
  "membershipExpiredAt": "2028-01-01T00:00:00.000Z"
}
```

> Pass `membershipCode: null` to remove membership. Pass `membershipExpiredAt: null` to remove expiry (making membership open-ended).

**Response `200`**
```json
{
  "meta": { "message": "Customer updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...CustomerProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` empty; duplicate email/phone/membershipCode; `points` < 0 |
| `401` | Missing or invalid token |
| `404` | Customer not found |

---

### 6. Delete Customer

```
DELETE /api/v3/customers/:customerId
```

Permanently deletes a customer.

**Response `200`**
```json
{
  "meta": { "message": "Customer deleted successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Customer not found |

---

### 7. Update Points

```
PUT /api/v3/customers/:customerId/points
```

Updates the customer's loyalty points balance using one of three operations.

**Request body**

```json
{
  "operation": "add",
  "points": 50
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `operation` | string | ✅ | `set`, `add`, or `deduct` |
| `points` | integer | ✅ | Must be ≥ 0 |

**Operations**

| Operation | Description |
|---|---|
| `set` | Replaces current balance with the given value |
| `add` | Adds the given value to the current balance |
| `deduct` | Subtracts the given value from the current balance (fails if balance is insufficient) |

**Response `200`**
```json
{
  "meta": { "message": "Points updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...CustomerProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Invalid `operation`; `points` missing or < 0; insufficient balance on `deduct` |
| `401` | Missing or invalid token |
| `404` | Customer not found |

---

### 8. Extend Membership

```
PUT /api/v3/customers/:customerId/membership
```

Sets or extends the membership expiry date for a customer.

**Request body**

```json
{
  "membershipExpiredAt": "2027-12-31T23:59:59.000Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `membershipExpiredAt` | ISO date string | ✅ | Must be a future date |

**Response `200`**
```json
{
  "meta": { "message": "Membership extended successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...CustomerProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `membershipExpiredAt` missing or is a past date |
| `401` | Missing or invalid token |
| `404` | Customer not found |
