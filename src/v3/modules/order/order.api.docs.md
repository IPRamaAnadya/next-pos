# Order API v3

Base path: `/api/v3`

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

---

## Orders

### GET /orders

List orders for the authenticated tenant.

**Query Parameters**

| Parameter     | Type   | Description                                         |
|---------------|--------|-----------------------------------------------------|
| page          | number | Page number (default: 1)                            |
| pageSize      | number | Items per page (default: 20, max: 100)              |
| search        | string | Filter by orderNo or customerName (partial match)   |
| paymentStatus | string | Filter by paymentStatus (`paid`, `partial`, `unpaid`) |
| orderStatus   | string | Filter by orderStatus code                          |
| staffId       | string | Filter by staffId                                   |
| customerId    | string | Filter by customerId                                |
| startDate     | string | ISO date — createdAt >= startDate                   |
| endDate       | string | ISO date — createdAt <= endDate                     |

**Response 200**
```json
{
  "meta": { "success": true, "message": "Success", "code": 200 },
  "data": [
    {
      "id": "uuid",
      "orderNo": "0LD3F9K2",
      "subtotal": 50000,
      "totalAmount": 45000,
      "grandTotal": 45000,
      "paidAmount": 45000,
      "remainingBalance": null,
      "change": null,
      "taxAmount": null,
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "orderStatus": "CONFIRMED",
      "paymentDate": "2025-01-01T00:00:00.000Z",
      "note": null,
      "customerId": null,
      "customerName": "Walk-in",
      "discountId": null,
      "discountName": null,
      "discountType": null,
      "discountValue": null,
      "discountAmount": null,
      "discountRewardType": null,
      "pointUsed": null,
      "staffId": "uuid",
      "lastPointsAccumulation": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productName": "Nasi Goreng",
          "productPrice": 25000,
          "qty": 2
        }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

---

### POST /orders

Create a new order. Automatically deducts stock for countable products and adjusts customer points.

**Request Body**

| Field                  | Type                         | Required | Description                                         |
|------------------------|------------------------------|----------|-----------------------------------------------------|
| items                  | CreateOrderItemInput[]       | Yes      | Order line items                                    |
| paidAmount             | number                       | Yes      | Amount tendered by customer (>= 0)                  |
| paymentMethod          | string                       | No       | e.g. `"cash"`, `"qris"`, `"transfer"`               |
| paymentDate            | ISO string                   | No       | Defaults to now                                     |
| note                   | string                       | No       | Order note                                          |
| customerId             | string                       | No       | Link to existing customer                           |
| customerName           | string                       | No       | Customer display name                               |
| staffId                | string                       | No       | Serving staff                                       |
| discountId             | string                       | No       | Apply discount by ID                                |
| discountCode           | string                       | No       | Apply discount by code                              |
| taxAmount              | number                       | No       | Tax to add on top of totalAmount                    |
| pointUsed              | number                       | No       | Customer points to redeem                           |
| lastPointsAccumulation | number                       | No       | Points to credit to customer after this order       |
| orderStatus            | string                       | No       | Initial status code (default: `CONFIRMED`)          |

**CreateOrderItemInput**

| Field        | Type   | Required | Description                      |
|--------------|--------|----------|----------------------------------|
| productId    | string | No       | Link to product (for stock deduction) |
| productName  | string | Yes      | Display name                     |
| productPrice | number | Yes      | Price per unit (must be > 0)     |
| qty          | number | Yes      | Quantity (must be > 0)           |

**Price computation**
- `subtotal` = Σ (productPrice × qty)
- `totalAmount` = subtotal − discountAmount
- `grandTotal` = totalAmount + taxAmount
- `paymentStatus` = `paid` | `partial` | `unpaid`
- `change` = paidAmount − grandTotal (if overpaid, else null)
- `remainingBalance` = grandTotal − paidAmount (if underpaid, else null)

**Response 200**
```json
{
  "meta": { "success": true, "message": "Order created successfully", "code": 200 },
  "data": { /* OrderProfile with items and logs */ }
}
```

---

### GET /orders/:orderId

Get a single order including items and order logs.

**Response 200** — `OrderProfile` with `logs` included.

---

### PUT /orders/:orderId

Update order metadata. If `paidAmount` is changed, `paymentStatus`, `change`, and `remainingBalance` are automatically recomputed.

**Request Body** *(all optional)*

| Field         | Type       | Description                        |
|---------------|------------|------------------------------------|
| paidAmount    | number     | New paid amount                    |
| paymentMethod | string     | Payment method                     |
| paymentDate   | ISO string | null to clear                      |
| note          | string     | Order note                         |
| staffId       | string     | Serving staff                      |
| customerName  | string     | Customer display name              |

---

### DELETE /orders/:orderId

**Owner only.** Permanently deletes the order and its logs (cascade).

---

### PUT /orders/:orderId/status

Update the order's status and write an audit log entry.

**Request Body**

| Field   | Type   | Required | Description                            |
|---------|--------|----------|----------------------------------------|
| status  | string | Yes      | OrderStatus code (e.g. `CONFIRMED`)    |
| note    | string | No       | Reason for status change               |
| staffId | string | No       | Staff performing the update            |

**Response 200**
```json
{
  "meta": { "success": true, "message": "Order status updated", "code": 200 },
  "data": { /* OrderProfile with logs */ }
}
```

---

## Order Statuses

Tenant-managed list of possible order statuses (code/name pairs with sort order).

### GET /order-statuses

List all order statuses for the tenant.

**Query Parameters**

| Parameter | Type    | Description                    |
|-----------|---------|--------------------------------|
| page      | number  | Page number (default: 1)       |
| pageSize  | number  | Items per page (default: 50)   |
| isActive  | boolean | Filter active/inactive records |

**Response 200**
```json
{
  "meta": { "success": true, "message": "Success", "code": 200 },
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "code": "CONFIRMED",
      "name": "Confirmed",
      "order": 1,
      "isFinal": false,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 3, "totalPages": 1 }
}
```

---

### POST /order-statuses

**Owner only.** Create a new order status. `code` is automatically uppercased and must be unique per tenant.

**Request Body**

| Field    | Type    | Required | Description                            |
|----------|---------|----------|----------------------------------------|
| code     | string  | Yes      | Unique code (uppercased automatically) |
| name     | string  | Yes      | Display name (unique per tenant)       |
| order    | number  | Yes      | Sort order                             |
| isFinal  | boolean | No       | Marks a terminal status (default: false) |
| isActive | boolean | No       | Active flag (default: true)            |

---

### GET /order-statuses/:statusId

Get a single order status record.

---

### PUT /order-statuses/:statusId

**Owner only.** Update an order status. Validates code/name uniqueness (excluding self).

**Request Body** *(all optional)*

| Field    | Type    | Description                     |
|----------|---------|---------------------------------|
| code     | string  | New code (uppercased)           |
| name     | string  | New display name                |
| order    | number  | New sort order                  |
| isFinal  | boolean | Terminal status flag            |
| isActive | boolean | Active flag                     |

---

### DELETE /order-statuses/:statusId

**Owner only.** Delete an order status. Blocked if any order references this status code.

---

## Error Responses

| Code | Scenario                          |
|------|-----------------------------------|
| 400  | Validation error (field-level)    |
| 401  | Missing or invalid JWT            |
| 403  | Insufficient role (owner required)|
| 404  | Resource not found                |
| 500  | Internal server error             |
