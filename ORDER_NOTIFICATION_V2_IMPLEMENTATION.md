# Order Notification Automation V2

## Overview

This document describes the automated order notification system that integrates with the Customer Messaging V2 feature. The system automatically sends WhatsApp notifications to customers when orders are created, updated, paid, completed, or cancelled.

## Features

### 1. **Configurable Notifications Per Event**
- Enable/disable notifications for each order event type
- Assign specific templates for each event
- Fine-grained control over notification triggers

### 2. **Supported Order Events**
- **ORDER_CREATED**: When a new order is created
- **ORDER_UPDATED**: When an order is modified
- **ORDER_PAID**: When an order payment is completed
- **ORDER_COMPLETED**: When an order is marked as completed
- **ORDER_CANCELLED**: When an order is cancelled

### 3. **Custom Bulk Notifications**
- Send notifications to multiple customers at once
- Target by customer IDs or phone numbers
- Use templates or send direct messages

## Database Schema

### TenantNotificationConfig (Extended)

```prisma
model TenantNotificationConfig {
  // Existing fields
  id        String   @id @default(uuid())
  tenantId  String   @unique
  provider  String   @default("fonnte")
  apiToken  String
  apiUrl    String
  isActive  Boolean  @default(true)
  
  // Notification settings per event
  enableOrderCreated       Boolean  @default(true)
  enableOrderUpdated       Boolean  @default(false)
  enableOrderPaid          Boolean  @default(true)
  enableOrderCompleted     Boolean  @default(false)
  enableOrderCancelled     Boolean  @default(false)
  
  // Template assignments per event
  orderCreatedTemplateId   String?  @db.Uuid
  orderUpdatedTemplateId   String?  @db.Uuid
  orderPaidTemplateId      String?  @db.Uuid
  orderCompletedTemplateId String?  @db.Uuid
  orderCancelledTemplateId String?  @db.Uuid
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### NotificationEvent Enum (Extended)

```prisma
enum NotificationEvent {
  ORDER_CREATED
  ORDER_UPDATED
  ORDER_PAID
  ORDER_COMPLETED
  ORDER_CANCELLED
  PAYMENT_REMINDER
  CUSTOM
}
```

## Architecture

### Use Cases

#### 1. SendOrderNotificationUseCase
**Location**: `src/application/use-cases/customer-messaging/SendOrderNotificationUseCase.ts`

**Purpose**: Handles sending order notifications based on event type with enable/disable checks and template resolution.

**Key Features**:
- Checks if notification is enabled for the event
- Resolves template (custom or default)
- Sends notification using Customer Messaging V2
- Returns success/skip status

**Usage**:
```typescript
const useCase = new SendOrderNotificationUseCase(prisma);

await useCase.execute({
  tenantId: "tenant-uuid",
  event: OrderNotificationEvent.ORDER_CREATED,
  recipient: "+628123456789",
  variables: {
    customerName: "John Doe",
    grandTotal: "Rp150.000",
    orderNumber: "ORD12345",
  },
});
```

#### 2. GetNotificationSettingsUseCase
**Location**: `src/application/use-cases/customer-messaging/GetNotificationSettingsUseCase.ts`

**Purpose**: Retrieve notification settings for a tenant.

**Usage**:
```typescript
const useCase = new GetNotificationSettingsUseCase(prisma);
const settings = await useCase.execute(tenantId);
```

#### 3. UpdateNotificationSettingsUseCase
**Location**: `src/application/use-cases/customer-messaging/UpdateNotificationSettingsUseCase.ts`

**Purpose**: Update notification settings for a tenant.

**Usage**:
```typescript
const useCase = new UpdateNotificationSettingsUseCase(prisma);

await useCase.execute({
  tenantId: "tenant-uuid",
  enableOrderCreated: true,
  orderCreatedTemplateId: "template-uuid",
  enableOrderUpdated: false,
});
```

### Integration with Order Use Cases

#### CreateOrderUseCase
**Modified**: `src/application/use-cases/CreateOrderUseCase.ts`

**Changes**:
- Added `SendOrderNotificationUseCase` dependency
- Sends `ORDER_CREATED` or `ORDER_PAID` notification based on payment status
- Async notification (doesn't block order creation)

**Notification Variables**:
- `customerName`: Customer name
- `grandTotal`: Formatted grand total (e.g., "Rp150.000")
- `orderNumber`: First 8 characters of order ID

#### UpdateOrderUseCase
**Modified**: `src/application/use-cases/UpdateOrderUseCase.ts`

**Changes**:
- Added `SendOrderNotificationUseCase` dependency
- Sends appropriate notification based on what changed:
  - `ORDER_PAID`: If payment status changed from unpaid to paid
  - `ORDER_UPDATED`: If order was updated but not paid
- Async notification (doesn't block order update)

## API Endpoints

### 1. Get Notification Settings

**Endpoint**: `GET /api/v2/tenants/{tenantId}/messaging/settings`

**Response**:
```json
{
  "success": true,
  "data": {
    "enableOrderCreated": true,
    "enableOrderUpdated": false,
    "enableOrderPaid": true,
    "enableOrderCompleted": false,
    "enableOrderCancelled": false,
    "orderCreatedTemplateId": "template-uuid-1",
    "orderUpdatedTemplateId": null,
    "orderPaidTemplateId": "template-uuid-2",
    "orderCompletedTemplateId": null,
    "orderCancelledTemplateId": null
  }
}
```

### 2. Update Notification Settings

**Endpoint**: `PUT /api/v2/tenants/{tenantId}/messaging/settings`

**Request Body**:
```json
{
  "enableOrderCreated": true,
  "enableOrderUpdated": true,
  "enableOrderPaid": true,
  "orderCreatedTemplateId": "template-uuid-1",
  "orderUpdatedTemplateId": "template-uuid-2",
  "orderPaidTemplateId": "template-uuid-3"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "config-uuid",
    "tenantId": "tenant-uuid",
    "enableOrderCreated": true,
    "enableOrderUpdated": true,
    "enableOrderPaid": true,
    "orderCreatedTemplateId": "template-uuid-1",
    "orderUpdatedTemplateId": "template-uuid-2",
    "orderPaidTemplateId": "template-uuid-3",
    // ... other fields
  }
}
```

### 3. Send Custom Notification to Customer List

**Endpoint**: `POST /api/v2/tenants/{tenantId}/messaging/send-custom`

**Request Body (Using Customer IDs)**:
```json
{
  "customerIds": ["customer-uuid-1", "customer-uuid-2", "customer-uuid-3"],
  "templateId": "template-uuid",
  "variables": {
    "message": "Special promotion today!",
    "discount": "20%"
  }
}
```

**Request Body (Using Phone Numbers)**:
```json
{
  "phoneNumbers": ["+628123456789", "+628987654321"],
  "message": "Your order is ready for pickup!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 3,
    "succeeded": 3,
    "failed": 0,
    "recipients": ["+628123456789", "+628987654321", "+628111222333"]
  }
}
```

## Configuration Guide

### Step 1: Set Up Notification Provider
1. Go to `/api/v2/tenants/{tenantId}/messaging/configs`
2. Create or update Fonnte configuration with API token

### Step 2: Create Message Templates
1. Go to `/api/v2/tenants/{tenantId}/messaging/templates`
2. Create templates for each event:
   - **ORDER_CREATED**: "Halo {{customerName}}, pesanan Anda sebesar {{grandTotal}} telah dibuat dengan nomor {{orderNumber}}."
   - **ORDER_UPDATED**: "Pesanan Anda {{orderNumber}} telah diperbarui. Total: {{grandTotal}}."
   - **ORDER_PAID**: "Terima kasih! Pembayaran sebesar {{grandTotal}} untuk pesanan {{orderNumber}} telah diterima."

### Step 3: Configure Notification Settings
1. Go to `/api/v2/tenants/{tenantId}/messaging/settings`
2. Enable desired events
3. Assign templates to events

### Step 4: Test
1. Create a test order
2. Check notification logs at `/api/v2/tenants/{tenantId}/messaging/logs`

## Template Variables

### Available Variables for Order Notifications
- `{{customerName}}`: Customer's name
- `{{grandTotal}}`: Formatted total amount (e.g., "Rp150.000")
- `{{orderNumber}}`: Order number/ID

### Custom Variables
You can add custom variables when creating templates and pass them during notification sending.

## Behavior

### Automatic Notifications
- **Order Creation**: Triggers `ORDER_CREATED` (if unpaid) or `ORDER_PAID` (if paid)
- **Order Update**: Triggers `ORDER_UPDATED` or `ORDER_PAID` (if payment status changed)

### Notification Skipping
Notifications are skipped when:
- Event is disabled in settings
- No template found for the event
- Provider config is inactive
- Customer has no phone number

### Error Handling
- Notification failures don't block order operations
- Errors are logged to console
- Status is tracked in `NotificationLog` table

## Migration

### Database Migrations
1. `20251123034039_add_order_notification_settings`: Added notification settings fields
2. `20251123034118_add_notification_events`: Added ORDER_UPDATED and other events to enum

### Code Migration
- Old `NotificationService` interface is still used but notifications now go through Customer Messaging V2
- Backward compatible - existing orders continue to work

## Testing

### Test Order Creation Notification
```bash
POST /api/v2/tenants/{tenantId}/orders
{
  "customerId": "customer-uuid",
  "items": [...],
  "paymentStatus": "unpaid"
}
```
Expected: `ORDER_CREATED` notification sent (if enabled)

### Test Order Payment Notification
```bash
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
{
  "paymentStatus": "paid"
}
```
Expected: `ORDER_PAID` notification sent (if enabled)

### Test Custom Bulk Notification
```bash
POST /api/v2/tenants/{tenantId}/messaging/send-custom
{
  "customerIds": ["uuid-1", "uuid-2"],
  "templateId": "template-uuid",
  "variables": { "message": "Test" }
}
```
Expected: Notifications sent to all customers

## Monitoring

### Check Notification Logs
**Endpoint**: `GET /api/v2/tenants/{tenantId}/messaging/logs`

**Query Parameters**:
- `status`: Filter by status (sent, failed, pending)
- `startDate`, `endDate`: Date range filter

### Dashboard Metrics
- Total notifications sent per event type
- Success/failure rates
- Most used templates

## Future Enhancements

1. **Scheduling**: Schedule notifications for later delivery
2. **Retry Logic**: Automatic retry for failed notifications
3. **Queue System**: Background job processing for bulk notifications
4. **A/B Testing**: Test different templates
5. **Analytics**: Track open rates, click rates
6. **Multi-channel**: Add SMS, Email support
7. **Notification History**: Customer-level notification view

## Troubleshooting

### Notifications Not Sending
1. Check if event is enabled: `GET /api/v2/tenants/{tenantId}/messaging/settings`
2. Verify template exists: `GET /api/v2/tenants/{tenantId}/messaging/templates`
3. Check provider config: `GET /api/v2/tenants/{tenantId}/messaging/configs`
4. Review logs: `GET /api/v2/tenants/{tenantId}/messaging/logs`

### Template Not Found
- Ensure template exists for the event type
- Assign template ID in notification settings
- Check if template is not marked as `isCustom: true` (use event-specific templates)

### Provider Errors
- Verify Fonnte API token is valid
- Check API token credits/balance
- Test provider with: `POST /api/v2/tenants/{tenantId}/messaging/test`

## Related Documentation
- [Customer Messaging V2 Implementation](./CUSTOMER_MESSAGING_V2_IMPLEMENTATION.md)
- [Clean Architecture V2 Guide](./CLEAN_ARCHITECTURE_V2_GUIDE.md)
- [API V2 Reference](./API_V2_REFERENCE.md)
