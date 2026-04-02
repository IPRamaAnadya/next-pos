# Discount API — V3

Base URL: `/api/v3/discounts`

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

Both `owner` and `staff` tokens have full access to all discount endpoints.

---

## Data Shape: `DiscountProfile`

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "code": "SUMMER20",
  "name": "Summer Sale",
  "description": "20% off everything",
  "type": "percentage",
  "value": 20,
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validTo": "2026-08-31T23:59:59.000Z",
  "minPurchase": 50000,
  "maxDiscount": 100000,
  "applicableItems": null,
  "rewardType": null,
  "isMemberOnly": false,
  "isActive": true,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `type` | string | `percentage` or `fixed_amount` |
| `value` | number | Percentage (0–100) or fixed currency amount |
| `isActive` | boolean | Computed: `validFrom ≤ now ≤ validTo`; `null` = open-ended |
| `minPurchase` | number \| null | Minimum order total required to apply discount |
| `maxDiscount` | number \| null | Cap on the maximum discount amount (for percentage type) |
| `applicableItems` | any \| null | Optional JSON for item-level restrictions |
| `rewardType` | string \| null | Optional label for reward program grouping |

---

## Endpoints

### 1. List Discounts

```
GET /api/v3/discounts
```

Returns a paginated list of discounts for the current tenant.

**Query parameters**

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | |
| `pageSize` | number | `20` | Max `100` |
| `search` | string | — | Matches name (case-insensitive) |
| `type` | string | — | `percentage` or `fixed_amount` |
| `isActive` | boolean | — | `true` = currently active only; `false` = inactive only |
| `isMemberOnly` | boolean | — | Filter member-only discounts |

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": [ { "...DiscountProfile..." } ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

### 2. Create Discount

```
POST /api/v3/discounts
```

Creates a new discount for the current tenant.

**Request body**

```json
{
  "code": "SUMMER20",
  "name": "Summer Sale",
  "description": "20% off all orders",
  "type": "percentage",
  "value": 20,
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validTo": "2026-08-31T23:59:59.000Z",
  "minPurchase": 50000,
  "maxDiscount": 100000,
  "isMemberOnly": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `type` | string | ✅ | `percentage` or `fixed_amount` |
| `value` | number | ✅ | Must be > 0; percentage max 100 |
| `code` | string | ❌ | Must be unique across the tenant |
| `description` | string | ❌ | |
| `validFrom` | ISO date string | ❌ | Must be before `validTo` if both provided |
| `validTo` | ISO date string | ❌ | |
| `minPurchase` | number | ❌ | |
| `maxDiscount` | number | ❌ | Only meaningful for `percentage` type |
| `applicableItems` | any | ❌ | |
| `rewardType` | string | ❌ | |
| `isMemberOnly` | boolean | ❌ | Default `false` |

**Response `200`**
```json
{
  "meta": { "message": "Discount created successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...DiscountProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name`, `type`, or `value` missing; `type` invalid; `value` ≤ 0; percentage > 100; duplicate `code`; `validFrom` ≥ `validTo` |
| `401` | Missing or invalid token |

---

### 3. Get Active Discounts

```
GET /api/v3/discounts/active
```

Returns all currently active discounts (no pagination). Discounts are active when `validFrom ≤ now ≤ validTo` (null boundaries are treated as open-ended).

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": [ { "...DiscountProfile..." } ],
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

### 4. Validate Discount

```
POST /api/v3/discounts/validate
```

Checks whether a discount can be applied to a given order amount and returns the calculated discount amount. Useful before creating an order to confirm the discount is applicable.

**Request body** — provide either `discountId` or `code` (not both required)

```json
{
  "discountId": "uuid",
  "orderAmount": 150000,
  "isMemberCustomer": false
}
```

or

```json
{
  "code": "SUMMER20",
  "orderAmount": 150000,
  "isMemberCustomer": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderAmount` | number | ✅ | Total order amount before discount |
| `discountId` | uuid | ❌* | *At least one of `discountId` or `code` required |
| `code` | string | ❌* | |
| `isMemberCustomer` | boolean | ❌ | Default `false` |

**Response `200` — valid**
```json
{
  "meta": { "message": "Discount is valid", "success": true, "code": 200, "errors": [] },
  "data": {
    "isValid": true,
    "discount": { "...DiscountProfile..." },
    "discountAmount": 30000
  },
  "pagination": null
}
```

**Response `400` — invalid**
```json
{
  "meta": {
    "message": "Validation error",
    "success": false,
    "code": 400,
    "errors": [{ "field": "discount", "message": "Discount is not currently active" }]
  },
  "data": null,
  "pagination": null
}
```

Possible validation reasons:

| Reason | Description |
|---|---|
| `Discount not found` | ID/code doesn't match any discount for this tenant |
| `Discount is not currently active` | Outside validity window |
| `This discount is only available for members` | `isMemberOnly: true` but `isMemberCustomer: false` |
| `Minimum purchase of X required` | Order amount is below `minPurchase` |

**Errors**

| Code | Reason |
|---|---|
| `400` | `orderAmount` missing; neither `discountId` nor `code` provided; discount not applicable |
| `401` | Missing or invalid token |

---

### 5. Get Discount

```
GET /api/v3/discounts/:discountId
```

Returns a single discount by ID.

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": { "...DiscountProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Discount not found or belongs to another tenant |

---

### 6. Update Discount

```
PUT /api/v3/discounts/:discountId
```

Updates a discount. All fields are optional; only provided fields are changed.

**Request body**

```json
{
  "name": "End of Season Sale",
  "value": 25,
  "validTo": "2026-09-30T23:59:59.000Z",
  "maxDiscount": 150000
}
```

> To remove `code`, `validFrom`, `validTo`, `minPurchase`, or `maxDiscount`, pass them as `null`.

**Response `200`**
```json
{
  "meta": { "message": "Discount updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...DiscountProfile..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` empty; invalid `type`; `value` ≤ 0; percentage > 100; duplicate `code`; `validFrom` ≥ `validTo` |
| `401` | Missing or invalid token |
| `404` | Discount not found |

---

### 7. Delete Discount

```
DELETE /api/v3/discounts/:discountId
```

Permanently deletes a discount.

> Note: Deleting a discount does not affect orders that have already used it.

**Response `200`**
```json
{
  "meta": { "message": "Discount deleted successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Discount not found |
