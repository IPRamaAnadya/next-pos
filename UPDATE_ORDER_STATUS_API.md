# Update Order Status API Documentation

## Overview
This API endpoint allows you to update an order's status using a status code. When you update the order status, the system will:
1. ✅ Validate the status code exists
2. ✅ Update the order with the new status
3. ✅ Create an order log entry for audit trail
4. ✅ Send notification to customer (if configured)

---

## Endpoint

```
PATCH /api/v2/tenants/{tenantId}/orders/{orderId}
```

### Method: `PATCH`

---

## Request

### Headers
```
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | string (UUID) | Yes | The tenant ID |
| `orderId` | string (UUID) | Yes | The order ID to update |

### Request Body
```json
{
  "statusCode": "processing"
}
```

### Body Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `statusCode` | string | Yes | The code of the order status (e.g., "pending", "processing", "completed") |

---

## Examples

### Example 1: Update Order to Processing
```bash
PATCH /api/v2/tenants/123e4567-e89b-12d3-a456-426614174000/orders/987fcdeb-51a2-43e1-b456-426614174999
```

**Request:**
```json
{
  "statusCode": "processing"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "987fcdeb-51a2-43e1-b456-426614174999",
      "tenantId": "123e4567-e89b-12d3-a456-426614174000",
      "orderNo": "ORD-20251127-001",
      "orderStatus": "Processing",
      "paymentStatus": "paid",
      "grandTotal": 150000,
      "subtotal": 150000,
      "totalAmount": 150000,
      "paidAmount": 150000,
      "change": 0,
      "customerName": "John Doe",
      "customerId": "abc123-...",
      "staffId": "def456-...",
      "createdAt": "2025-11-27T10:00:00.000Z",
      "updatedAt": "2025-11-27T10:30:00.000Z",
      "items": [
        {
          "id": "item-1",
          "productId": "prod-123",
          "productName": "Nasi Goreng",
          "productPrice": 25000,
          "qty": 2,
          "subtotal": 50000
        }
      ]
    }
  }
}
```

### Example 2: Update Order to Completed
```json
{
  "statusCode": "completed"
}
```

### Example 3: Update Order to Cancelled
```json
{
  "statusCode": "cancelled"
}
```

---

## Common Status Codes

The available status codes depend on your tenant's configuration. Common examples include:

| Status Code | Description |
|-------------|-------------|
| `pending` | Order is pending |
| `processing` | Order is being processed |
| `ready` | Order is ready for pickup/delivery |
| `completed` | Order is completed |
| `cancelled` | Order is cancelled |

You can manage status codes via the Order Status API:
- **GET** `/api/v2/tenants/{tenantId}/order-statuses` - List all statuses

---

## Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Order status updated |
| 400 | Bad Request - Invalid status code or missing required fields |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Order or status code not found |
| 500 | Internal Server Error |

---

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "statusCode",
      "message": "Status code is required"
    }
  ]
}
```

### 404 - Status Code Not Found
```json
{
  "success": false,
  "message": "Order status with code 'invalid_code' not found"
}
```

### 404 - Order Not Found
```json
{
  "success": false,
  "message": "Order with ID 987fcdeb-51a2-43e1-b456-426614174999 not found"
}
```

---

## Automatic Order Log Creation

When you update an order status, the system automatically creates an **OrderLog** entry:

```prisma
model OrderLog {
  id        String   @id @default(uuid())
  orderId   String   // The order being updated
  staffId   String?  // The staff who made the change (optional)
  status    String   // The new status name
  note      String?  // Auto-generated note
  createdAt DateTime @default(now())
}
```

**Example Log Entry:**
```json
{
  "id": "log-uuid-...",
  "orderId": "987fcdeb-51a2-43e1-b456-426614174999",
  "status": "Processing",
  "note": "Status updated to Processing",
  "createdAt": "2025-11-27T10:30:00.000Z"
}
```

---

## Customer Notifications

If the order has a `customerId` and the customer has a valid phone number, the system will automatically send a WhatsApp notification about the status change (fire-and-forget, won't block the API response).

---

## Implementation Details

### Use Case: `UpdateOrderStatusByCodeUseCase`

**What it does:**
1. Validates the status code exists in the database
2. Retrieves the current order
3. Updates the order with the new status name
4. Creates an OrderLog entry (asynchronous)
5. Sends customer notification (asynchronous)

**Code Flow:**
```typescript
// 1. Validate status code exists
const orderStatus = await prisma.orderStatus.findUnique({
  where: { code: 'processing' }
});

// 2. Update order
const updatedOrder = await orderRepository.update(orderId, {
  orderStatus: orderStatus.name // "Processing"
}, tenantId);

// 3. Create log (async)
await prisma.orderLog.create({
  data: {
    orderId: orderId,
    status: orderStatus.name,
    note: `Status updated to ${orderStatus.name}`
  }
});

// 4. Send notification (async)
// ... notification logic ...
```

---

## Testing with cURL

```bash
curl -X PATCH \
  'http://localhost:3000/api/v2/tenants/YOUR_TENANT_ID/orders/YOUR_ORDER_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "statusCode": "processing"
  }'
```

---

## Testing with Postman

1. Create a new request
2. Set method to `PATCH`
3. URL: `{{baseUrl}}/api/v2/tenants/{{tenantId}}/orders/{{orderId}}`
4. Headers:
   - `Authorization`: `Bearer {{token}}`
   - `Content-Type`: `application/json`
5. Body (raw JSON):
   ```json
   {
     "statusCode": "processing"
   }
   ```
6. Send request

---

## Best Practices

1. **Always validate status codes** - Get available status codes first using the Order Status API
2. **Handle async operations** - Log creation and notifications run asynchronously
3. **Check tenant ID** - Ensure the status code belongs to the correct tenant
4. **Monitor logs** - Check console for order log creation and notification status
5. **Use meaningful status codes** - Use lowercase with underscores (e.g., `ready_for_pickup`)

---

## Related APIs

- **List Order Statuses**: `GET /api/v2/tenants/{tenantId}/order-statuses`
- **Create Order Status**: `POST /api/v2/tenants/{tenantId}/order-statuses`
- **Update Order Status Config**: `PUT /api/v2/tenants/{tenantId}/order-statuses/{id}`
- **Get Order Details**: `GET /api/v2/tenants/{tenantId}/orders/{orderId}`
- **Full Order Update**: `PUT /api/v2/tenants/{tenantId}/orders/{orderId}`

---

## Changelog

- **2025-11-27**: Initial documentation
  - PATCH endpoint for updating order status by code
  - Automatic order log creation
  - Customer notification integration
