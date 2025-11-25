# Push Notification Feature - Firebase Cloud Messaging (FCM)

## Overview
Complete push notification system using Firebase Cloud Messaging (FCM) for the Next POS application. Supports sending notifications to specific users, staff members, topics, and broadcast to all owners.

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Database Schema](#database-schema)
7. [Notification Events](#notification-events)

---

## Features

### ✅ Token Management
- Register FCM tokens for users and staff
- Deactivate tokens when users log out
- Automatic cleanup of inactive tokens
- Support for multiple devices per user

### ✅ Notification Targeting
- **Token**: Send to specific device
- **Topic**: Send to all subscribers of a topic
- **Condition**: Complex targeting with conditions
- **Broadcast**: Send to all owners of a tenant

### ✅ Notification Categories
- **Donation**: Payment status updates (pending, confirmed, failed, expired)
- **Order**: New orders, order updates
- **Payment**: Payment confirmation
- **Inventory**: Low stock alerts
- **Subscription**: Expiration warnings
- **System**: Announcements and updates
- **Custom**: User-defined notifications

### ✅ Features
- Rich notifications with images
- Custom data payload
- Priority support (high/normal)
- Automatic retry on failure
- Notification history tracking
- Statistics and analytics

---

## Architecture

```
src/
├── app/api/v2/tenants/[tenantId]/push-notifications/
│   ├── tokens/route.ts                    # Register/list tokens
│   ├── tokens/[fcmToken]/route.ts         # Deactivate token
│   ├── send/route.ts                      # Send notification
│   ├── broadcast/route.ts                 # Broadcast to owners
│   ├── history/route.ts                   # Notification history
│   ├── statistics/route.ts                # Statistics
│   └── topics/
│       ├── subscribe/route.ts             # Subscribe to topic
│       └── unsubscribe/route.ts           # Unsubscribe from topic
│
├── domain/
│   ├── entities/PushNotification.ts       # Domain entities & DTOs
│   └── repositories/PushNotificationRepository.ts  # Repository interfaces
│
├── infrastructure/
│   ├── repositories/PrismaPushNotificationRepository.ts  # Prisma implementation
│   └── services/
│       ├── FCMService.ts                  # FCM integration
│       └── NotificationHelper.ts          # Event-based notifications
│
├── application/use-cases/PushNotificationUseCases.ts  # Business logic
├── presentation/controllers/PushNotificationController.ts  # Controller
└── lib/firebase-admin.ts                  # Firebase Admin SDK initialization
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase-admin
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 3. Environment Variables
Add to your `.env` file:

```env
# Firebase Admin SDK Service Account (entire JSON as string)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important**: The entire service account JSON should be on one line, wrapped in single quotes.

### 4. Run Database Migration
```bash
npx prisma migrate dev --name add_push_notifications
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

---

## API Endpoints

### Base URL
```
/api/v2/tenants/{tenantId}/push-notifications
```

### 1. Register FCM Token
```http
POST /tokens
Content-Type: application/json
Authorization: Bearer {token}

{
  "fcmToken": "string",
  "userId": "uuid (optional)",
  "staffId": "uuid (optional)",
  "deviceType": "ios|android|web (optional)",
  "deviceId": "string (optional)"
}
```

**Response:**
```json
{
  "meta": {
    "status": 200,
    "message": "FCM token registered successfully"
  },
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "fcmToken": "string",
    "isActive": true,
    "createdAt": "2025-11-25T...",
    "lastUsedAt": "2025-11-25T..."
  }
}
```

### 2. Get Active Tokens
```http
GET /tokens
Authorization: Bearer {token}
```

### 3. Deactivate Token
```http
DELETE /tokens/{fcmToken}
Authorization: Bearer {token}
```

### 4. Send Notification
```http
POST /send
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Notification Title",
  "body": "Notification message",
  "data": {
    "key": "value"
  },
  "imageUrl": "https://example.com/image.jpg (optional)",
  "targetType": "token|topic|condition|broadcast",
  "targetValue": "FCM token or topic name (required for token/topic/condition)",
  "category": "donation|order|payment|system (optional)",
  "eventType": "donation_pending|donation_confirmed (optional)",
  "priority": "high|normal (optional)"
}
```

### 5. Broadcast to All Owners
```http
POST /broadcast
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Broadcast Title",
  "body": "Broadcast message",
  "data": {
    "key": "value"
  },
  "imageUrl": "https://example.com/image.jpg (optional)",
  "category": "donation (optional)",
  "eventType": "donation_confirmed (optional)"
}
```

### 6. Get Notification History
```http
GET /history?limit=50&category=donation
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50)
- `category` (optional): Filter by category

### 7. Get Statistics
```http
GET /statistics?dateFrom=2025-01-01&dateTo=2025-12-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `dateFrom` (optional): Start date (ISO format)
- `dateTo` (optional): End date (ISO format)

**Response:**
```json
{
  "meta": {
    "status": 200,
    "message": "Statistics retrieved successfully"
  },
  "data": {
    "total": 1000,
    "sent": 950,
    "failed": 30,
    "pending": 20,
    "successRate": 95.00
  }
}
```

### 8. Subscribe to Topic
```http
POST /topics/subscribe
Content-Type: application/json
Authorization: Bearer {token}

{
  "tokenId": "FCM token string",
  "topic": "donations"
}
```

### 9. Unsubscribe from Topic
```http
POST /topics/unsubscribe
Content-Type: application/json
Authorization: Bearer {token}

{
  "tokenId": "FCM token string",
  "topic": "donations"
}
```

---

## Usage Examples

### Example 1: Register Token (Client Side)
```javascript
// Get FCM token from client
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
const fcmToken = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});

// Register with backend
await fetch('/api/v2/tenants/TENANT_ID/push-notifications/tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    fcmToken,
    userId: currentUserId,
    deviceType: 'web'
  })
});
```

### Example 2: Send Notification (Server Side)
```typescript
import { notificationHelper } from '@/infrastructure/services/NotificationHelper';

// When donation is confirmed
await notificationHelper.notifyDonationConfirmed(
  tenantId,
  donationId,
  'John Doe',
  100000,
  'IDR'
);
```

### Example 3: Broadcast Custom Message
```typescript
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';

const controller = new PushNotificationController();
await controller.broadcastToOwners({
  tenantId: 'tenant-uuid',
  title: '🎉 Promo Spesial',
  body: 'Dapatkan diskon 50% untuk semua menu!',
  imageUrl: 'https://example.com/promo.jpg',
  data: {
    promoId: '12345',
    discountPercent: '50'
  },
  category: 'custom',
  eventType: 'promo_announcement'
});
```

---

## Database Schema

### PushNotificationToken
Stores FCM tokens for users and staff.

```prisma
model PushNotificationToken {
  id         String   @id @default(uuid())
  tenantId   String
  userId     String?  // Owner token
  staffId    String?  // Staff token
  fcmToken   String   @unique
  deviceType String?  // ios, android, web
  deviceId   String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  lastUsedAt DateTime @default(now())
}
```

### PushNotificationMessage
Logs all sent notifications.

```prisma
model PushNotificationMessage {
  id          String   @id @default(uuid())
  tenantId    String
  title       String
  body        String
  data        Json?
  imageUrl    String?
  
  // Targeting
  targetType  String   // token, topic, condition, broadcast
  targetValue String?
  
  // Categorization
  category    String?  // donation, order, payment, system
  eventType   String?  // donation_pending, etc
  
  // Status
  status      String   @default("pending")  // pending, sent, failed
  sentAt      DateTime?
  failedAt    DateTime?
  
  // FCM Response
  fcmResponse Json?
  error       String?
  
  // Retry
  retryCount  Int      @default(0)
  maxRetries  Int      @default(3)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### PushNotificationSubscription
Topic subscriptions.

```prisma
model PushNotificationSubscription {
  id        String   @id @default(uuid())
  tenantId  String
  tokenId   String
  topic     String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tokenId, topic])
}
```

---

## Notification Events

### Donation Events
- `donation_pending`: New donation received, awaiting payment
- `donation_confirmed`: Payment confirmed (settlement)
- `donation_failed`: Payment failed
- `donation_expired`: Payment link expired

### Order Events
- `order_created`: New order placed
- `order_updated`: Order status changed
- `order_completed`: Order completed
- `order_cancelled`: Order cancelled

### Payment Events
- `payment_received`: Payment confirmed
- `payment_failed`: Payment failed

### Inventory Events
- `low_stock`: Product stock below minimum

### Subscription Events
- `subscription_expiring`: Subscription expiring soon
- `subscription_expired`: Subscription expired

### System Events
- `system_announcement`: General announcements
- `system_maintenance`: Maintenance notifications

---

## NotificationHelper Usage

The `NotificationHelper` service provides convenient methods for common notification scenarios:

```typescript
import { notificationHelper } from '@/infrastructure/services/NotificationHelper';

// Donation notifications
await notificationHelper.notifyDonationReceived(tenantId, donationId, donorName, amount);
await notificationHelper.notifyDonationConfirmed(tenantId, donationId, donorName, amount);
await notificationHelper.notifyDonationFailed(tenantId, donationId, donorName, amount);
await notificationHelper.notifyDonationExpired(tenantId, donationId, donorName, amount);

// Order notifications
await notificationHelper.notifyNewOrder(tenantId, orderId, orderNumber, totalAmount);
await notificationHelper.notifyPaymentReceived(tenantId, orderId, orderNumber, amount, paymentMethod);

// Inventory notifications
await notificationHelper.notifyLowStock(tenantId, productName, currentStock, minStock);

// System notifications
await notificationHelper.notifySystemAnnouncement(tenantId, title, message, imageUrl);
await notificationHelper.notifySubscriptionExpiring(tenantId, daysRemaining, expiryDate);

// Custom notifications
await notificationHelper.sendCustomNotification({
  tenantId,
  title: 'Custom Title',
  body: 'Custom message',
  data: { key: 'value' },
  category: 'custom'
});
```

---

## Best Practices

### 1. Token Management
- Register tokens on app/web startup
- Deactivate tokens on logout
- Update `lastUsedAt` when sending notifications
- Clean up inactive tokens periodically (e.g., tokens inactive for 30+ days)

### 2. Notification Content
- Keep titles under 50 characters
- Keep body text under 200 characters for better display
- Use emojis to make notifications more engaging
- Include relevant data in the `data` payload for deep linking

### 3. Error Handling
- Automatically retry failed notifications (up to 3 times)
- Log all notification attempts for debugging
- Monitor success rates via statistics endpoint
- Remove invalid tokens automatically

### 4. Topics
- Use topics for feature-specific notifications (e.g., "donations", "orders")
- Subscribe owners to "all_owners" topic for tenant-wide broadcasts
- Keep topic names simple and descriptive

### 5. Performance
- Use broadcast for notifications to all owners instead of individual sends
- Batch token subscriptions when possible
- Use topics for recurring notification patterns

---

## Testing

### Test Notification Sending
```bash
curl -X POST http://localhost:3000/api/v2/tenants/TENANT_ID/push-notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test",
    "targetType": "token",
    "targetValue": "YOUR_FCM_TOKEN"
  }'
```

### Test Broadcast
```bash
curl -X POST http://localhost:3000/api/v2/tenants/TENANT_ID/push-notifications/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Broadcast Test",
    "body": "Testing broadcast to all owners"
  }'
```

---

## Troubleshooting

### Notifications Not Sending
1. Verify Firebase Admin SDK is initialized
2. Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
3. Verify FCM tokens are valid and active
4. Check notification logs in `PushNotificationMessage` table

### Invalid Token Errors
- Token may have expired or been unregistered
- User may have uninstalled the app
- Token is automatically deactivated on repeated failures

### Permission Errors
- Ensure Firebase project has Cloud Messaging API enabled
- Verify service account has necessary permissions

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Tenant Isolation**: Users can only send notifications for their own tenants
3. **Rate Limiting**: Consider implementing rate limits for broadcast endpoints
4. **Token Validation**: FCM tokens are validated before storage
5. **Data Privacy**: Notification data should not include sensitive information

---

## Future Enhancements

- [ ] Scheduled notifications
- [ ] Rich notification templates
- [ ] A/B testing for notifications
- [ ] User notification preferences
- [ ] Analytics dashboard
- [ ] Push notification campaigns
- [ ] Localization support

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.
