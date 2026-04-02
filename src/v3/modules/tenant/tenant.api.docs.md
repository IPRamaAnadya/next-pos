# Tenant API — V3

Base URL: `/api/v3/tenant`

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

Token types and access levels:

| `type` | GET tenant | PUT tenant | GET settings | PUT settings |
|---|---|---|---|---|
| `owner` | ✅ | ✅ | ✅ | ✅ |
| `staff` | ✅ (read-only) | ❌ 403 | ✅ (read-only) | ❌ 403 |

---

## Endpoints

### 1. Get Tenant

```
GET /api/v3/tenant
```

Returns the store profile for the tenant associated with the current token. Accessible by both owner and staff tokens.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "name": "My Store",
    "email": "owner@example.com",
    "address": "Jl. Contoh No. 1",
    "phone": "081234567890",
    "storeCode": "MYSTR001",
    "isSubscribed": true,
    "subscribedUntil": "2026-12-31T00:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-01T00:00:00.000Z",
    "settings": {
      "showDiscount": false,
      "showTax": false
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

### 2. Update Tenant

```
PUT /api/v3/tenant
```

Updates the store's name, address, or phone. Only accessible with an `owner` token.

> `email` and `storeCode` cannot be changed through this endpoint. Email changes require a verification flow; changing `storeCode` would break existing staff logins.

**Headers**
```
Authorization: Bearer <token>   (must be type: "owner")
```

**Request body** — all fields optional; only provided fields are updated
```json
{
  "name": "New Store Name",
  "address": "Jl. Baru No. 5",
  "phone": "082345678901"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ❌ | Cannot be empty if provided |
| `address` | string | ❌ | |
| `phone` | string | ❌ | |

**Response `200`**
```json
{
  "meta": { "message": "Store updated successfully", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "name": "New Store Name",
    "email": "owner@example.com",
    "address": "Jl. Baru No. 5",
    "phone": "082345678901",
    "storeCode": "MYSTR001",
    "isSubscribed": true,
    "subscribedUntil": "2026-12-31T00:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-01T00:00:00.000Z",
    "settings": {
      "showDiscount": false,
      "showTax": false
    }
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` was provided but is empty |
| `401` | Missing or invalid token |
| `403` | Token type is `"staff"` — not allowed |

---

### 3. Get Settings

```
GET /api/v3/tenant/settings
```

Returns display settings for the store. Also included in the full tenant response above. If no settings row exists yet, defaults (`false` / `false`) are returned.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "showDiscount": false,
    "showTax": false
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

### 4. Update Settings

```
PUT /api/v3/tenant/settings
```

Toggles display settings for the store. Creates the settings row if it doesn't exist yet (upsert). Only accessible with an `owner` token.

**Headers**
```
Authorization: Bearer <token>   (must be type: "owner")
```

**Request body** — all fields optional; only provided fields are updated
```json
{
  "showDiscount": true,
  "showTax": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `showDiscount` | boolean | ❌ | Show discount on receipt / POS |
| `showTax` | boolean | ❌ | Show tax on receipt / POS |

**Response `200`**
```json
{
  "meta": { "message": "Store settings updated successfully", "success": true, "code": 200, "errors": [] },
  "data": {
    "showDiscount": true,
    "showTax": false
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `showDiscount` or `showTax` provided but is not a boolean |
| `401` | Missing or invalid token |
| `403` | Token type is `"staff"` — not allowed |

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
  "meta": { "message": "Only the store owner can update store information", "success": false, "code": 403, "errors": [] },
  "data": null,
  "pagination": null
}
```
