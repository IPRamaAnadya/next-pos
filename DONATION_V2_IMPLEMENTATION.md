# Donation Feature V2 Implementation

## Overview

The Donation Feature allows tenants using the POS system to make voluntary donations to support the platform. This feature is built following Clean Architecture principles with proper separation of concerns across Domain, Application, Infrastructure, and Presentation layers.

## Key Features

✅ **Flexible Donations**: Tenants can donate any amount at any time  
✅ **Multiple Payment Methods**: Support for Bank Transfer, E-Wallet (GoPay, OVO, DANA, ShopeePay), and QRIS  
✅ **Transaction Fee Management**: Configurable fees per payment method with recommendations  
✅ **Midtrans Integration**: Secure payment processing with Snap (popup)  
✅ **Auto-validation**: Webhook handling for automatic payment confirmation  
✅ **Donation History**: Complete tracking of all donations per tenant  
✅ **Admin Dashboard**: Comprehensive reports and statistics  
✅ **Monthly & Yearly Reports**: Detailed donation analytics  

## Architecture

### Domain Layer (`/src/domain`)

**Entities:**
- `Donation.ts` - Core donation entity with business logic
- `PaymentMethod.ts` - Payment method entity with fee calculations

**Repositories (Interfaces):**
- `DonationRepository.ts` - Contract for donation data access
- `PaymentMethodRepository.ts` - Contract for payment method data access

### Application Layer (`/src/application`)

**Use Cases:**
- `DonationUseCases.ts` - 9 donation use cases
- `PaymentMethodUseCases.ts` - 6 payment method use cases

**Services:**
- `DonationServiceContainer.ts` - Dependency injection container

### Infrastructure Layer (`/src/infrastructure`)

**Repositories:**
- `PrismaDonationRepository.ts` - Prisma-based donation data access
- `PrismaPaymentMethodRepository.ts` - Prisma-based payment method data access

### Presentation Layer (`/src/presentation`)

**DTOs:**
- `DonationRequestDTO.ts` - Request validation schemas (Yup)
- `DonationResponseDTO.ts` - Response transformation functions

**Controllers:**
- `DonationController.ts` - HTTP request handlers for donations
- `PaymentMethodController.ts` - HTTP request handlers for payment methods

## Database Schema

### DonationPaymentMethod

```prisma
model DonationPaymentMethod {
  id               String    @id @default(uuid())
  name             String    @unique
  code             String    @unique
  type             String    // "bank_transfer", "ewallet", "qris"
  transactionFee   Decimal   @map("transaction_fee")
  feePercentage    Decimal?  @map("fee_percentage")
  minAmount        Decimal   @map("min_amount")
  maxAmount        Decimal?  @map("max_amount")
  isActive         Boolean   @default(true)
  iconUrl          String?
  description      String?
  displayOrder     Int       @default(0)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  donations        TenantDonation[]
}
```

### TenantDonation

```prisma
model TenantDonation {
  id                 String           @id @default(uuid())
  tenantId           String           @map("tenant_id")
  paymentMethodId    String?          @map("payment_method_id")
  midtransOrderId    String           @unique @map("midtrans_order_id")
  snapToken          String?          @map("snap_token")
  amount             Decimal
  transactionFee     Decimal          @default(0)
  netAmount          Decimal          @map("net_amount")
  status             DonationStatus   @default(PENDING)
  paymentType        String?          @map("payment_type")
  transactionTime    DateTime?        @map("transaction_time")
  settlementTime     DateTime?        @map("settlement_time")
  expiryTime         DateTime?        @map("expiry_time")
  message            String?
  midtransResponse   Json?            @map("midtrans_response")
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  tenant             Tenant           @relation(...)
  paymentMethod      DonationPaymentMethod? @relation(...)
}

enum DonationStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}
```

## API Endpoints

### Tenant Endpoints (Authenticated)

#### Create Donation
```
POST /api/v2/tenants/:tenantId/donations
```

**Headers:**
```
Authorization: Bearer <tenant_jwt_token>
```

**Request Body:**
```json
{
  "payment_method_id": "uuid",
  "amount": 50000,
  "message": "Thank you for the great platform!"
}
```

**Response (201):**
```json
{
  "donation": {
    "id": "uuid",
    "tenant_id": "uuid",
    "payment_method_id": "uuid",
    "midtrans_order_id": "DON-1732234567890-abc12345",
    "snap_token": "snap_token_from_midtrans",
    "amount": 50000,
    "transaction_fee": 4000,
    "net_amount": 46000,
    "status": "PENDING",
    "payment_type": null,
    "transaction_time": null,
    "settlement_time": null,
    "expiry_time": "2024-11-23T10:00:00.000Z",
    "message": "Thank you for the great platform!",
    "created_at": "2024-11-22T10:00:00.000Z",
    "updated_at": "2024-11-22T10:00:00.000Z"
  },
  "snap_token": "snap_token_from_midtrans",
  "recommended_amount": 12000,
  "warning": "Your donation is below the recommended minimum of Rp 12,000..."
}
```

**Usage (Frontend):**
```javascript
// 1. Create donation
const response = await fetch(`/api/v2/tenants/${tenantId}/donations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    payment_method_id: selectedMethodId,
    amount: 50000,
    message: 'Thank you!'
  })
});

const data = await response.json();

// 2. Open Midtrans Snap
snap.pay(data.snap_token, {
  onSuccess: function(result) {
    console.log('Payment success:', result);
    // Webhook will auto-update donation status
  },
  onPending: function(result) {
    console.log('Payment pending:', result);
  },
  onError: function(result) {
    console.log('Payment error:', result);
  },
  onClose: function() {
    console.log('Payment popup closed');
  }
});
```

#### List Donations
```
GET /api/v2/tenants/:tenantId/donations/list?page=1&limit=10&status=PAID
```

**Response (200):**
```json
{
  "donations": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "amount": 50000,
      "status": "PAID",
      "created_at": "2024-11-22T10:00:00.000Z",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Donation Detail
```
GET /api/v2/tenants/:tenantId/donations/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "amount": 50000,
  "status": "PAID",
  "settlement_time": "2024-11-22T10:05:00.000Z",
  ...
}
```

#### Monthly Summary
```
GET /api/v2/tenants/:tenantId/donations/summary/monthly?year=2024&month=11
```

**Response (200):**
```json
{
  "tenant_id": "uuid",
  "year": 2024,
  "month": 11,
  "total_donations": 3,
  "total_amount": 150000,
  "total_net_amount": 138000,
  "successful_donations": 2,
  "pending_donations": 1,
  "failed_donations": 0
}
```

### Public Endpoints

#### List Active Payment Methods
```
GET /api/v2/payment-methods
```

**Response (200):**
```json
{
  "payment_methods": [
    {
      "id": "uuid",
      "name": "GoPay",
      "code": "gopay",
      "type": "ewallet",
      "transaction_fee": 2500,
      "fee_percentage": null,
      "min_amount": 1000,
      "max_amount": null,
      "is_active": true,
      "icon_url": "https://example.com/gopay.png",
      "description": "Pay with GoPay",
      "display_order": 1,
      "recommended_min_amount": 7500,
      "created_at": "2024-11-22T10:00:00.000Z",
      "updated_at": "2024-11-22T10:00:00.000Z"
    }
  ]
}
```

#### Get Payment Method Detail
```
GET /api/v2/payment-methods/:id
```

### Webhook Endpoint

#### Midtrans Donation Webhook
```
POST /api/v2/webhooks/midtrans/donation
```

**Request Body (from Midtrans):**
```json
{
  "order_id": "DON-1732234567890-abc12345",
  "transaction_status": "settlement",
  "payment_type": "gopay",
  "transaction_time": "2024-11-22 10:05:00",
  "settlement_time": "2024-11-22 10:05:30",
  "gross_amount": "50000.00",
  "fraud_status": "accept",
  ...
}
```

**Response (200):**
```json
{
  "success": true,
  "donation_id": "uuid",
  "status": "PAID"
}
```

### Admin Endpoints

#### List All Donations
```
GET /api/v2/admin/donations?page=1&limit=20&status=PAID&tenant_id=uuid
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `tenant_id` (optional)
- `status` (optional): PENDING, PAID, FAILED, EXPIRED
- `payment_method_id` (optional)
- `start_date` (optional): ISO datetime
- `end_date` (optional): ISO datetime

**Response (200):**
```json
{
  "donations": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Statistics
```
GET /api/v2/admin/donations/statistics?start_date=2024-11-01T00:00:00Z&end_date=2024-11-30T23:59:59Z
```

**Response (200):**
```json
{
  "total_donations": 150,
  "total_amount": 7500000,
  "total_net_amount": 6900000,
  "total_transaction_fees": 600000,
  "by_status": {
    "pending": 10,
    "paid": 120,
    "failed": 15,
    "expired": 5
  },
  "by_payment_method": [
    {
      "method_name": "GoPay",
      "count": 80,
      "amount": 4000000
    },
    {
      "method_name": "BCA Virtual Account",
      "count": 40,
      "amount": 2000000
    }
  ]
}
```

#### Monthly Report
```
GET /api/v2/admin/donations/reports/monthly/2024/11
```

**Response (200):**
```json
{
  "year": 2024,
  "month": 11,
  "total_donations": 150,
  "total_amount": 7500000,
  "total_net_amount": 6900000,
  "by_tenant": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Warung Makan Pak Budi",
      "donation_count": 3,
      "total_amount": 150000
    }
  ]
}
```

#### Yearly Report
```
GET /api/v2/admin/donations/reports/yearly/2024
```

**Response (200):**
```json
{
  "year": 2024,
  "total_donations": 1500,
  "total_amount": 75000000,
  "total_net_amount": 69000000,
  "by_month": [
    {
      "month": 1,
      "donation_count": 120,
      "total_amount": 6000000,
      "total_net_amount": 5520000
    },
    ...
  ]
}
```

#### Admin: Manage Payment Methods

**List All:**
```
GET /api/v2/admin/payment-methods
```

**Create:**
```
POST /api/v2/admin/payment-methods
Content-Type: application/json

{
  "name": "BCA Virtual Account",
  "code": "bca_va",
  "type": "bank_transfer",
  "transaction_fee": 4000,
  "fee_percentage": 0,
  "min_amount": 10000,
  "max_amount": 50000000,
  "icon_url": "https://example.com/bca.png",
  "description": "Transfer via BCA Virtual Account",
  "display_order": 1
}
```

**Update:**
```
PUT /api/v2/admin/payment-methods/:id
Content-Type: application/json

{
  "transaction_fee": 4500,
  "is_active": true
}
```

**Toggle Active:**
```
POST /api/v2/admin/payment-methods/:id/toggle
```

**Delete:**
```
DELETE /api/v2/admin/payment-methods/:id
```

## Configuration

### Environment Variables

```env
# Midtrans (already configured)
MIDTRANS_SERVER_KEY=SB-Mid-server-YpZymFpZIgxQbmLL6ei0skLd
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-Xl83f5azoIwTf2u-
MIDTRANS_PRODUCTION=false
```

### Payment Methods Setup

**Initial setup requires admin to create payment methods:**

```bash
# Example: Create GoPay payment method
POST /api/v2/admin/payment-methods
{
  "name": "GoPay",
  "code": "gopay",
  "type": "ewallet",
  "transaction_fee": 2500,
  "min_amount": 1000,
  "display_order": 1
}

# Create QRIS
POST /api/v2/admin/payment-methods
{
  "name": "QRIS",
  "code": "qris",
  "type": "qris",
  "transaction_fee": 3000,
  "min_amount": 1000,
  "display_order": 2
}

# Create BCA VA
POST /api/v2/admin/payment-methods
{
  "name": "BCA Virtual Account",
  "code": "bca_va",
  "type": "bank_transfer",
  "transaction_fee": 4000,
  "min_amount": 10000,
  "display_order": 3
}
```

## Business Logic

### Transaction Fee Handling

- Platform absorbs all transaction fees
- System recommends minimum donation = `transaction_fee * 3`
- Net amount calculation: `net_amount = amount - transaction_fee`
- Warning shown if donation below recommended amount

### Donation Status Flow

```
PENDING → (Webhook: settlement) → PAID
PENDING → (Webhook: deny/cancel/failure) → FAILED
PENDING → (Webhook: expire) → EXPIRED
PENDING → (Expiry time reached) → EXPIRED
```

### Expiry Times

- **Bank Transfer**: 24 hours
- **E-Wallet**: 1 hour
- **QRIS**: 1 hour

## Testing

### Create Sample Payment Methods (Admin)

```bash
curl -X POST http://localhost:3000/api/v2/admin/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GoPay",
    "code": "gopay",
    "type": "ewallet",
    "transaction_fee": 2500,
    "min_amount": 1000,
    "display_order": 1
  }'
```

### Create Test Donation (Tenant)

```bash
curl -X POST http://localhost:3000/api/v2/tenants/{tenantId}/donations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method_id": "payment-method-uuid",
    "amount": 50000,
    "message": "Test donation"
  }'
```

### Test Webhook (Midtrans Simulator)

```bash
curl -X POST http://localhost:3000/api/v2/webhooks/midtrans/donation \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "DON-1732234567890-abc12345",
    "transaction_status": "settlement",
    "payment_type": "gopay",
    "transaction_time": "2024-11-22 10:05:00",
    "settlement_time": "2024-11-22 10:05:30",
    "gross_amount": "50000.00",
    "fraud_status": "accept"
  }'
```

## Future Enhancements

- [ ] Email/WhatsApp notifications for successful donations
- [ ] Donation certificates/receipts
- [ ] Recurring donations
- [ ] Donation tiers/badges for tenants
- [ ] Public donation leaderboard (with consent)
- [ ] Export donation reports to CSV/PDF

## Notes

- ✅ No mandatory monthly donations (removed per requirements)
- ✅ Voluntary donations only
- ✅ Multiple donations per month allowed
- ✅ Complete donation tracking for superadmin
- ✅ Monthly and yearly reports available
- ✅ Midtrans Snap integration (sandbox for testing)
- ✅ Clean architecture implementation
- ✅ Optimized database queries with indices
- ✅ Webhook auto-validation implemented

## Support

For questions or issues, please refer to:
- Prisma schema: `/prisma/schema.prisma`
- Migration: `/prisma/migrations/20251121235022_add_donation_feature/`
- Controllers: `/src/presentation/controllers/Donation*.ts`
- Use cases: `/src/application/use-cases/Donation*.ts`
