# Payment Method Fee Structure

## Overview

The donation payment system now supports flexible fee structures to accommodate various payment methods with different fee models. The system can handle:

1. **Fixed Fees** - A flat amount charged per transaction
2. **Percentage Fees** - A percentage of the transaction amount
3. **Combined Fees** - Fixed + Percentage fees
4. **Tax/PPN** - Additional tax percentage (e.g., 11% PPN in Indonesia)

## Fee Calculation Formula

```
Total Fee = Fixed Fee + (Amount × Fee Percentage / 100) + (Amount × Tax Percentage / 100)
Net Amount = Amount - Total Fee
```

## Schema Fields

### DonationPaymentMethod

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `transaction_fee` | Decimal(15,2) | Fixed fee amount in IDR | 2500 |
| `fee_percentage` | Decimal(5,2) | Optional percentage fee | 2.0 (for 2%) |
| `tax_percentage` | Decimal(5,2) | Optional tax/PPN percentage | 11.0 (for 11%) |

## Fee Examples

### 1. Fixed Fee Only
**Example: BCA Virtual Account**
- Fixed Fee: Rp 4,000
- Fee Percentage: null
- Tax Percentage: null

**Calculation for Rp 100,000 donation:**
```
Total Fee = 4,000 + 0 + 0 = Rp 4,000
Net Amount = 100,000 - 4,000 = Rp 96,000
```

### 2. Percentage Fee Only
**Example: Some E-Wallet**
- Fixed Fee: 0
- Fee Percentage: 2%
- Tax Percentage: null

**Calculation for Rp 100,000 donation:**
```
Total Fee = 0 + (100,000 × 2 / 100) + 0 = Rp 2,000
Net Amount = 100,000 - 2,000 = Rp 98,000
```

### 3. Combined Fee (Fixed + Percentage)
**Example: GoPay**
- Fixed Fee: Rp 1,000
- Fee Percentage: 2%
- Tax Percentage: null

**Calculation for Rp 100,000 donation:**
```
Total Fee = 1,000 + (100,000 × 2 / 100) + 0 = Rp 3,000
Net Amount = 100,000 - 3,000 = Rp 97,000
```

### 4. Fixed Fee + Tax
**Example: Bank Transfer with PPN**
- Fixed Fee: Rp 5,000
- Fee Percentage: null
- Tax Percentage: 11%

**Calculation for Rp 100,000 donation:**
```
Total Fee = 5,000 + 0 + (100,000 × 11 / 100) = Rp 16,000
Net Amount = 100,000 - 16,000 = Rp 84,000
```

### 5. All Combined (Fixed + Percentage + Tax)
**Example: Credit Card**
- Fixed Fee: Rp 2,000
- Fee Percentage: 2.5%
- Tax Percentage: 11%

**Calculation for Rp 100,000 donation:**
```
Total Fee = 2,000 + (100,000 × 2.5 / 100) + (100,000 × 11 / 100) = Rp 15,500
Net Amount = 100,000 - 15,500 = Rp 84,500
```

## API Usage

### Create Payment Method

```json
POST /api/v2/admin/payment-methods
Authorization: Bearer {admin_token}

{
  "name": "GoPay",
  "code": "gopay",
  "type": "ewallet",
  "transaction_fee": 1000,
  "fee_percentage": 2.0,
  "tax_percentage": null,
  "min_amount": 1000,
  "max_amount": null,
  "icon_url": "https://example.com/gopay.png",
  "description": "Pay with GoPay",
  "display_order": 1
}
```

### Update Payment Method

```json
PUT /api/v2/admin/payment-methods/{id}
Authorization: Bearer {admin_token}

{
  "transaction_fee": 1500,
  "fee_percentage": 2.5,
  "tax_percentage": 11.0
}
```

### Response Format

```json
{
  "meta": {
    "message": "Payment method created successfully",
    "success": true,
    "code": 201
  },
  "data": {
    "id": "uuid",
    "name": "GoPay",
    "code": "gopay",
    "type": "ewallet",
    "transaction_fee": 1000,
    "fee_percentage": 2.0,
    "tax_percentage": null,
    "min_amount": 1000,
    "max_amount": null,
    "is_active": true,
    "icon_url": "https://example.com/gopay.png",
    "description": "Pay with GoPay",
    "display_order": 1,
    "recommended_min_amount": 3000,
    "created_at": "2024-11-22T10:00:00.000Z",
    "updated_at": "2024-11-22T10:00:00.000Z"
  }
}
```

## Implementation Details

### Domain Entity
The `PaymentMethod` entity includes a `calculateTotalFee()` method that automatically computes the total fee based on all configured fee components:

```typescript
calculateTotalFee(amount: number): number {
  let fee = this.transactionFee;
  
  // Add percentage-based fee (e.g., 2% for GoPay)
  if (this.feePercentage && this.feePercentage > 0) {
    fee += (amount * this.feePercentage) / 100;
  }
  
  // Add tax/PPN (e.g., 11% PPN)
  if (this.taxPercentage && this.taxPercentage > 0) {
    fee += (amount * this.taxPercentage) / 100;
  }
  
  return Math.round(fee);
}
```

### Recommended Minimum Amount
The system calculates a recommended minimum donation amount to ensure the donation remains meaningful after fees:

```typescript
getRecommendedMinAmount(): number {
  // Recommended minimum ensures at least 3x the transaction fee goes to the tenant
  return Math.max(this.minAmount, this.transactionFee * 3);
}
```

## Migration

The `tax_percentage` field was added via migration:
```bash
npx prisma migrate dev --name add_tax_percentage_to_payment_method
```

Migration file: `20251122132629_add_tax_percentage_to_payment_method`

## Best Practices

1. **Set Appropriate Fees**: Configure fees that reflect actual payment gateway costs
2. **Use Tax Field for PPN**: Use `tax_percentage` for government-mandated taxes
3. **Test Calculations**: Always verify fee calculations match expected results
4. **Display Transparency**: Show fee breakdown to donors before payment
5. **Update Documentation**: Keep Postman collection and documentation in sync

## Common Payment Methods in Indonesia

| Payment Method | Fixed Fee | Fee % | Tax % | Notes |
|----------------|-----------|-------|-------|-------|
| BCA VA | 4,000 | - | - | Standard bank transfer |
| GoPay | 1,000 | 2% | - | E-wallet |
| OVO | 1,500 | 2% | - | E-wallet |
| QRIS | 500 | 0.7% | - | Universal QR |
| Credit Card | 2,000 | 2.5% | 11% | With PPN |

*Note: These are example values. Actual fees vary by payment gateway provider.*
