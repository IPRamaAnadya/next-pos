# Order Notification Integration Summary

## Overview
The order notification system is now fully integrated with order creation and update operations. Notifications are sent automatically based on order events.

## Integration Points

### 1. **Create Order** (`CreateOrderUseCase`)
When an order is created, the system automatically determines which notification to send:

- **ORDER_CREATED**: Sent when order is created with `paymentStatus = 'unpaid'` or `'partial'`
- **ORDER_PAID**: Sent when order is created with `paymentStatus = 'paid'`

**Variables passed to template:**
- `customerName`: Customer's name from database
- `grandTotal`: Formatted as `Rp150.000` (Indonesian format)
- `orderNumber`: The `orderNo` field from the order (e.g., "ORD-2024-001")

### 2. **Update Order** (`UpdateOrderUseCase`)
When an order is updated, the system checks what changed and sends appropriate notification:

- **ORDER_PAID**: Sent when `paymentStatus` changes from `'unpaid'/'partial'` → `'paid'`
- **ORDER_COMPLETED**: Sent when `orderStatus` changes to `'completed'`
- **ORDER_CANCELLED**: Sent when `orderStatus` changes to `'cancelled'`
- **ORDER_UPDATED**: Sent for any other order updates (only if enabled in settings)

**Priority order** (first match wins):
1. Order status → completed ✅
2. Order status → cancelled ✅
3. Payment status → paid ✅
4. Any other update → ORDER_UPDATED

**Variables passed to template:**
- `customerName`: Customer's name
- `grandTotal`: Formatted total (e.g., "Rp200.000")
- `orderNumber`: The actual `orderNo` field

## Configuration Required

### 1. Setup Fonnte Configuration
```json
POST /api/v2/tenants/{tenantId}/messaging/configs
{
  "provider": "fonnte",
  "apiToken": "your-fonnte-token",
  "apiUrl": "https://api.fonnte.com/send",
  "isActive": true
}
```

### 2. Create Notification Templates
Create templates for each event type:

#### ORDER_CREATED Template
```json
POST /api/v2/tenants/{tenantId}/messaging/templates
{
  "name": "Order Created",
  "event": "ORDER_CREATED",
  "message": "Halo {{customerName}}! Pesanan Anda {{orderNumber}} sebesar {{grandTotal}} telah dibuat. Terima kasih!",
  "isCustom": false
}
```

#### ORDER_PAID Template
```json
{
  "name": "Payment Received",
  "event": "ORDER_PAID",
  "message": "Terima kasih {{customerName}}! Pembayaran sebesar {{grandTotal}} untuk pesanan {{orderNumber}} telah diterima. ✓",
  "isCustom": false
}
```

#### ORDER_UPDATED Template
```json
{
  "name": "Order Updated",
  "event": "ORDER_UPDATED",
  "message": "Halo {{customerName}}, pesanan {{orderNumber}} Anda telah diperbarui. Total: {{grandTotal}}.",
  "isCustom": false
}
```

#### ORDER_COMPLETED Template
```json
{
  "name": "Order Completed",
  "event": "ORDER_COMPLETED",
  "message": "Halo {{customerName}}! Pesanan {{orderNumber}} Anda telah selesai. Total: {{grandTotal}}. Terima kasih telah berbelanja!",
  "isCustom": false
}
```

#### ORDER_CANCELLED Template
```json
{
  "name": "Order Cancelled",
  "event": "ORDER_CANCELLED",
  "message": "Halo {{customerName}}, pesanan {{orderNumber}} Anda telah dibatalkan. Jika ada pertanyaan, silakan hubungi kami.",
  "isCustom": false
}
```

### 3. Enable Notifications
```json
PUT /api/v2/tenants/{tenantId}/messaging/settings
{
  "enableOrderCreated": true,
  "enableOrderPaid": true,
  "enableOrderUpdated": false,
  "enableOrderCompleted": true,
  "enableOrderCancelled": true,
  "orderCreatedTemplateId": "template-uuid-1",
  "orderPaidTemplateId": "template-uuid-2",
  "orderUpdatedTemplateId": "template-uuid-3",
  "orderCompletedTemplateId": "template-uuid-4",
  "orderCancelledTemplateId": "template-uuid-5"
}
```

## Testing Scenarios

### Scenario 1: Create Unpaid Order → ORDER_CREATED
```json
POST /api/v2/tenants/{tenantId}/orders
{
  "customerId": "customer-uuid",
  "paymentStatus": "unpaid",
  "orderStatus": "pending",
  "items": [...],
  "grandTotal": 150000
}
```
✅ Sends ORDER_CREATED notification if enabled

### Scenario 2: Create Paid Order → ORDER_PAID
```json
POST /api/v2/tenants/{tenantId}/orders
{
  "customerId": "customer-uuid",
  "paymentStatus": "paid",
  "orderStatus": "pending",
  "items": [...],
  "grandTotal": 150000
}
```
✅ Sends ORDER_PAID notification if enabled

### Scenario 3: Update Payment to Paid → ORDER_PAID
```json
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
{
  "paymentStatus": "paid"
}
```
✅ Sends ORDER_PAID notification if enabled

### Scenario 4: Complete Order → ORDER_COMPLETED
```json
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
{
  "orderStatus": "completed"
}
```
✅ Sends ORDER_COMPLETED notification if enabled

### Scenario 5: Cancel Order → ORDER_CANCELLED
```json
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
{
  "orderStatus": "cancelled"
}
```
✅ Sends ORDER_CANCELLED notification if enabled

### Scenario 6: Update Order Details → ORDER_UPDATED
```json
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
{
  "note": "Customer requested extra packaging"
}
```
✅ Sends ORDER_UPDATED notification if enabled (only if not changing status/payment)

## Important Notes

1. **Phone Number Required**: Customer must have a valid phone number in the database
2. **Phone Normalization**: All phone numbers are automatically normalized:
   - `0812-3456-789` → `62812345678`
   - `+62 811 222 333` → `62811222333`
   - Minimum 10 digits after normalization

3. **Non-Blocking**: Notifications are sent asynchronously and never block order operations
4. **Error Handling**: Notification failures are logged but don't affect order creation/updates
5. **Skip Conditions**: Notifications are skipped if:
   - Customer has no phone number
   - Phone number is invalid (< 10 digits)
   - Notification is disabled in settings
   - No template configured for the event
   - Config is inactive

## Monitoring

Check notification logs:
```
GET /api/v2/tenants/{tenantId}/messaging/logs?limit=50&page=1
```

Filter by status:
```
GET /api/v2/tenants/{tenantId}/messaging/logs?status=failed
```

## Variables Available in Templates

All order notification templates have access to these variables:
- `{{customerName}}`: Customer's name
- `{{grandTotal}}`: Order total in Indonesian format (Rp150.000)
- `{{orderNumber}}`: Order number from `orderNo` field

## Troubleshooting

1. **No notification sent?**
   - Check if notification is enabled in settings
   - Verify customer has phone number
   - Check notification logs for errors

2. **Wrong template used?**
   - Verify `templateId` is set in notification settings
   - Check template event matches the notification event

3. **Phone number invalid?**
   - Must be at least 10 digits after normalization
   - Check customer's phone field in database

4. **Fonnte API error?**
   - Verify API token is correct
   - Check Fonnte API status
   - Review notification logs for provider response
