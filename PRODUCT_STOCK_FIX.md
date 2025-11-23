# Product Stock Validation Fix

## 🐛 Issue Fixed

**Problem**: The validation was too strict and required all products of type 'good' to have a stock value, which caused errors for products that don't use stock tracking.

**Error**: 
```
Goods must have a non-negative stock value
```

## ✅ Solution Applied

Updated the business logic to properly handle products without stock tracking:

### 1. **ProductUseCases** - Relaxed Stock Validation
```typescript
// BEFORE: Required stock for all goods
if (data.type === 'good' && (data.stock === null || data.stock < 0)) {
  throw new Error('Goods must have a non-negative stock value');
}

// AFTER: Only validate if stock is provided
if (data.type === 'good' && data.stock !== null && data.stock < 0) {
  throw new Error('Stock value cannot be negative');
}
```

### 2. **Product Entity** - Updated Business Logic
```typescript
// isInStock() method now handles null stock
public isInStock(): boolean {
  if (this.type === 'service') return true;
  if (this.stock === null) return true; // Products without stock tracking are always "in stock"
  return this.stock > 0;
}

// canDecreaseStock() method now handles null stock
public canDecreaseStock(quantity: number): boolean {
  if (this.type === 'service') return true;
  if (this.stock === null) return true; // Products without stock tracking can always be "sold"
  return this.stock >= quantity;
}
```

### 3. **ProductDomainService** - Updated Validation Logic
```typescript
// Stock operation validation now handles null stock
static validateStockOperation(product: Product, quantity: number): void {
  if (product.type === 'service') return;
  if (product.stock === null) return; // No constraints for products without stock tracking
  if (!product.canDecreaseStock(quantity)) {
    throw new Error(`Insufficient stock. Available: ${product.stock}, Required: ${quantity}`);
  }
}
```

### 4. **Repository** - Updated Stock Filtering
```typescript
// Updated filtering logic for "in stock" products
if (filters?.inStock === true) {
  whereClause.OR = [
    { type: 'service' }, // Services are always "in stock"
    { AND: [{ type: 'good' }, { stock: { gt: 0 } }] }, // Goods with positive stock
    { AND: [{ type: 'good' }, { stock: null }] } // Goods without stock tracking
  ];
}
```

### 5. **Validation Schema** - Enhanced Stock Handling
```typescript
// Added transform to properly handle empty values
stock: yup.number().optional().nullable().min(0, 'Stock cannot be negative')
  .integer('Stock must be a whole number')
  .transform((value, originalValue) => {
    // Convert empty string or undefined to null for optional stock tracking
    if (originalValue === '' || originalValue === undefined) return null;
    return value;
  })
```

### 6. **Stock Update Logic** - Added Protection
```typescript
// Prevent stock updates on products without stock tracking
if (product.stock === null) {
  throw new Error('Cannot update stock for products without stock tracking');
}
```

## 🎯 Product Stock Behavior Summary

| Product Type | Stock Value | Behavior |
|--------------|-------------|----------|
| **Service** | `null` (ignored) | Always available, no stock constraints |
| **Good** | `null` | No stock tracking, always available |
| **Good** | `0` | Out of stock, not available |
| **Good** | `> 0` | In stock, available |

## ✅ What's Fixed

1. **✅ Create Products**: Can now create goods without stock tracking (`stock: null`)
2. **✅ Update Products**: Can set stock to `null` to disable tracking
3. **✅ Stock Operations**: Properly handles products without stock tracking
4. **✅ Availability Check**: Returns `true` for products without stock tracking
5. **✅ Filtering**: "In stock" filter includes products without stock tracking
6. **✅ Validation**: No longer forces stock values for all goods

## 🔧 Usage Examples

### Create Product Without Stock Tracking
```json
POST /api/v2/tenants/{id}/products
{
  "name": "Digital Product",
  "type": "good",
  "price": 50000,
  "stock": null  // ← No stock tracking
}
```

### Create Product With Stock Tracking  
```json
POST /api/v2/tenants/{id}/products
{
  "name": "Physical Product",
  "type": "good", 
  "price": 50000,
  "stock": 100  // ← With stock tracking
}
```

The Product API now properly supports both stock-tracked and non-stock-tracked goods! 🎉