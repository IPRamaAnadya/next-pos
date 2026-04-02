# Auth API — V3

Base URL: `/api/v3/auth`

All responses follow the standard envelope:

```json
{
  "meta": {
    "message": "string",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

On validation failure, `errors` contains per-field details:
```json
{
  "meta": {
    "message": "Validation failed",
    "success": false,
    "code": 400,
    "errors": [
      { "field": "email", "message": "Email is required" }
    ]
  },
  "data": null,
  "pagination": null
}
```

---

## Login flows

There are **two login endpoints**:

| Who | Endpoint | Redirects to |
|---|---|---|
| Store owner | `POST /api/v3/auth/login` | Dashboard |
| Staff employee | `POST /api/v3/auth/staff` | Cashier / POS |

The `type` field in the JWT payload identifies the session:

| `type` | Who |
|---|---|
| `owner` | Store owner (email + password) |
| `staff` | Staff employee (username + password + store code) |

---

## Endpoints

### 1. Owner Login

```
POST /api/v3/auth/login
```

Owner logs in with email and password. Token `type` is `"owner"` — the frontend should redirect to the **dashboard**.

**Request body**
```json
{
  "email": "owner@example.com",
  "password": "secret123"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`**
```json
{
  "meta": { "message": "Login successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "displayName": "John",
      "photoURL": null,
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "USER",
      "type": "owner"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `email` or `password` |
| `400` | Invalid credentials |
| `400` | Account uses social login |

---

### 2. Staff Login

```
POST /api/v3/auth/staff
```

Staff employee logs in using their staff credentials and the store code. Token `type` is `"staff"` — the frontend should redirect to the **cashier / POS**.

**Request body**
```json
{
  "username": "kasir01",
  "password": "secret123",
  "storeCode": "MYSTR001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | ✅ | Staff username (unique per store) |
| `password` | string | ✅ | |
| `storeCode` | string | ✅ | 8-char store code shown in owner dashboard |

**Response `200`**
```json
{
  "meta": { "message": "Login successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "username": "kasir01",
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "cashier",
      "isOwner": false,
      "type": "staff"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `username`, `password`, or `storeCode` |
| `400` | Invalid username, password, or store code |

---

### 3. Register

```
POST /api/v3/auth/register
```

Creates a new owner account along with a store (tenant). A `storeCode` is auto-generated if not provided. Returns an owner token.

**Request body**
```json
{
  "email": "owner@example.com",
  "password": "secret123",
  "tenantName": "My Store",
  "tenantAddress": "Jl. Contoh No. 1",
  "tenantPhone": "081234567890",
  "storeCode": "MYSTR001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `password` | string | ✅ | Min 6 characters |
| `tenantName` | string | ✅ | Store / business name |
| `tenantAddress` | string | ❌ | |
| `tenantPhone` | string | ❌ | |
| `storeCode` | string | ❌ | Auto-generated 8-char code if omitted |

**Response `200`**
```json
{
  "meta": { "message": "Registration successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "displayName": null,
      "photoURL": null,
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "USER",
      "type": "owner"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing required fields |
| `400` | Password less than 6 characters |
| `400` | Email already registered |
| `400` | Provided `storeCode` is already taken |

---

### 4. Forgot Password

```
POST /api/v3/auth/forgot-password
```

Sends a 6-digit OTP to the email address. The OTP expires in **15 minutes**. Always returns `200` regardless of whether the email exists (prevents enumeration). Only works for owner accounts (email-based).

**Request body**
```json
{
  "email": "owner@example.com"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |

**Response `200`**
```json
{
  "meta": {
    "message": "If this email is registered, you will receive an OTP.",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `email` |

---

### 5. Reset Password

```
POST /api/v3/auth/reset-password
```

Verifies the OTP from Redis and updates the password. The OTP is consumed and deleted on success.

**Request body**
```json
{
  "email": "owner@example.com",
  "otp": "482910",
  "newPassword": "newSecret123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `otp` | string | ✅ | 6-digit code from email |
| `newPassword` | string | ✅ | Min 6 characters |

**Response `200`**
```json
{
  "meta": { "message": "Password reset successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing fields |
| `400` | Invalid or expired OTP |
| `400` | `newPassword` less than 6 characters |

---

### 6. Change Password

```
PUT /api/v3/auth/change-password
```

Changes the password for the authenticated owner. Requires the current password for verification.

> Staff tokens (`type: "staff"`) cannot use this endpoint — staff passwords are managed by the store owner.

**Headers**
```
Authorization: Bearer <token>
```

**Request body**
```json
{
  "currentPassword": "oldSecret123",
  "newPassword": "newSecret456"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `currentPassword` | string | ✅ | |
| `newPassword` | string | ✅ | Min 6 characters |

**Response `200`**
```json
{
  "meta": { "message": "Password changed successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing fields |
| `400` | `currentPassword` is incorrect |
| `400` | `newPassword` less than 6 characters |
| `401` | Missing or invalid token |
| `403` | Staff token — not allowed |

---

### 7. Get Current User (Me)

```
GET /api/v3/auth/me
```

Returns the profile of the currently authenticated user or staff. Shape differs by token `type`.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200` — Owner token (`type: "owner"`)**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "email": "owner@example.com",
    "displayName": "John",
    "photoURL": null,
    "tenantId": "uuid",
    "tenantName": "My Store",
    "storeCode": "MYSTR001",
    "role": "USER",
    "type": "owner"
  },
  "pagination": null
}
```

**Response `200` — Staff token (`type: "staff"`)**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "username": "kasir01",
    "tenantId": "uuid",
    "tenantName": "My Store",
    "storeCode": "MYSTR001",
    "role": "cashier",
    "isOwner": false,
    "type": "staff"
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

## Common Error Responses

**`401` Unauthorized**
```json
{
  "meta": { "message": "Missing authorization token", "success": false, "code": 401, "errors": [] },
  "data": null,
  "pagination": null
}
```

**`403` Forbidden**
```json
{
  "meta": { "message": "Staff password changes must be done by the store owner", "success": false, "code": 403, "errors": [] },
  "data": null,
  "pagination": null
}
```

**`500` Internal Server Error**
```json
{
  "meta": { "message": "Terjadi kesalahan pada server", "success": false, "code": 500, "errors": [] },
  "data": null,
  "pagination": null
}
```


All responses follow the standard envelope:

```json
{
  "meta": {
    "message": "string",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

On validation failure, `errors` contains per-field details:
```json
{
  "meta": {
    "message": "Validation failed",
    "success": false,
    "code": 400,
    "errors": [
      { "field": "email", "message": "Email is required" }
    ]
  },
  "data": null,
  "pagination": null
}
```

---

## Token types

The `type` field inside the JWT distinguishes session context:

| `type` | Who | Use case |
|---|---|---|
| `dashboard` | Store owner | Web/mobile dashboard app |
| `cashier` | Store owner | Cashier / POS app |
| `staff` | Staff employee | Staff login inside cashier app |

---

## Endpoints

### 1. Owner Login — Dashboard

```
POST /api/v3/auth/login
```

Owner logs into the dashboard app.

**Request body**
```json
{
  "email": "owner@example.com",
  "password": "secret123"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`**
```json
{
  "meta": { "message": "Login successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "displayName": "John",
      "photoURL": null,
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "USER",
      "type": "dashboard"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `email` or `password` |
| `400` | Invalid credentials |
| `400` | Account uses social login |

---

### 2. Owner Login — Cashier Mode

```
POST /api/v3/auth/cashier
```

Owner logs into the cashier/POS app. Returns a token with `type: "cashier"`. The `storeCode` ties the session to a specific store.

**Request body**
```json
{
  "email": "owner@example.com",
  "password": "secret123",
  "storeCode": "MYSTR001"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |
| `storeCode` | string | ✅ |

**Response `200`**
```json
{
  "meta": { "message": "Login successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "displayName": "John",
      "photoURL": null,
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "USER",
      "type": "cashier"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `email`, `password`, or `storeCode` |
| `400` | Invalid credentials |
| `400` | `storeCode` not found or does not belong to this account |

---

### 3. Staff Login

```
POST /api/v3/auth/staff
```

Staff employee logs in using their staff credentials and the store code. Returns a token with `type: "staff"`.

**Request body**
```json
{
  "username": "kasir01",
  "password": "secret123",
  "storeCode": "MYSTR001"
}
```

| Field | Type | Required |
|---|---|---|
| `username` | string | ✅ |
| `password` | string | ✅ |
| `storeCode` | string | ✅ |

**Response `200`**
```json
{
  "meta": { "message": "Login successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "username": "kasir01",
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "cashier",
      "isOwner": false,
      "type": "staff"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `username`, `password`, or `storeCode` |
| `400` | Invalid username, password, or store code |

---

### 4. Register

```
POST /api/v3/auth/register
```

Creates a new owner account along with a store (tenant). A `storeCode` is auto-generated if not provided.

**Request body**
```json
{
  "email": "owner@example.com",
  "password": "secret123",
  "tenantName": "My Store",
  "tenantAddress": "Jl. Contoh No. 1",
  "tenantPhone": "081234567890",
  "storeCode": "MYSTR001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `password` | string | ✅ | Min 6 characters |
| `tenantName` | string | ✅ | Store / business name |
| `tenantAddress` | string | ❌ | |
| `tenantPhone` | string | ❌ | |
| `storeCode` | string | ❌ | Auto-generated 8-char code if omitted |

**Response `200`**
```json
{
  "meta": { "message": "Registration successful", "success": true, "code": 200, "errors": [] },
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "displayName": null,
      "photoURL": null,
      "tenantId": "uuid",
      "tenantName": "My Store",
      "storeCode": "MYSTR001",
      "role": "USER",
      "type": "dashboard"
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing required fields |
| `400` | Password less than 6 characters |
| `400` | Email already registered |
| `400` | Provided `storeCode` is already taken |

---

### 5. Forgot Password

```
POST /api/v3/auth/forgot-password
```

Sends a 6-digit OTP to the email address. The OTP expires in **15 minutes**. Always returns `200` regardless of whether the email exists (prevents enumeration).

**Request body**
```json
{
  "email": "owner@example.com"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |

**Response `200`**
```json
{
  "meta": {
    "message": "If this email is registered, you will receive an OTP.",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing `email` |

---

### 6. Reset Password

```
POST /api/v3/auth/reset-password
```

Verifies the OTP from Redis and updates the password. The OTP is consumed and deleted on success.

**Request body**
```json
{
  "email": "owner@example.com",
  "otp": "482910",
  "newPassword": "newSecret123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `otp` | string | ✅ | 6-digit code from email |
| `newPassword` | string | ✅ | Min 6 characters |

**Response `200`**
```json
{
  "meta": { "message": "Password reset successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing fields |
| `400` | Invalid or expired OTP |
| `400` | `newPassword` less than 6 characters |

---

### 7. Change Password

```
PUT /api/v3/auth/change-password
```

Changes the password for the authenticated owner. Requires the current password for verification. Staff tokens cannot use this endpoint — staff passwords are managed by the store owner.

**Headers**
```
Authorization: Bearer <token>
```

> Token must have `type: "dashboard"` or `type: "cashier"`. `type: "staff"` returns `403`.

**Request body**
```json
{
  "currentPassword": "oldSecret123",
  "newPassword": "newSecret456"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `currentPassword` | string | ✅ | |
| `newPassword` | string | ✅ | Min 6 characters |

**Response `200`**
```json
{
  "meta": { "message": "Password changed successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | Missing fields |
| `400` | `currentPassword` is incorrect |
| `400` | `newPassword` less than 6 characters |
| `401` | Missing or invalid token |
| `403` | Staff token used — not allowed |

---

### 8. Get Current User (Me)

```
GET /api/v3/auth/me
```

Returns the profile of the currently authenticated user or staff member. The shape differs based on the token `type`.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200` — Owner token (`type: "dashboard"` or `"cashier"`)**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "email": "owner@example.com",
    "displayName": "John",
    "photoURL": null,
    "tenantId": "uuid",
    "tenantName": "My Store",
    "storeCode": "MYSTR001",
    "role": "USER",
    "type": "dashboard"
  },
  "pagination": null
}
```

**Response `200` — Staff token (`type: "staff"`)**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "username": "kasir01",
    "tenantId": "uuid",
    "tenantName": "My Store",
    "storeCode": "MYSTR001",
    "role": "cashier",
    "isOwner": false,
    "type": "staff"
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

## Common Error Responses

**`401` Unauthorized**
```json
{
  "meta": { "message": "Missing authorization token", "success": false, "code": 401, "errors": [] },
  "data": null,
  "pagination": null
}
```

**`403` Forbidden**
```json
{
  "meta": { "message": "Staff password changes must be done by the store owner", "success": false, "code": 403, "errors": [] },
  "data": null,
  "pagination": null
}
```

**`500` Internal Server Error**
```json
{
  "meta": { "message": "Terjadi kesalahan pada server", "success": false, "code": 500, "errors": [] },
  "data": null,
  "pagination": null
}
```
