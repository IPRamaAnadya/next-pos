# Product Schema Update - isCountable & Unit Fields

## Changes Summary

Added two new fields to the Product model to support better inventory management:
- `isCountable`: Boolean field (default: true) to indicate if a product should be tracked by quantity
- `unit`: String field (default: "pcs") to specify the unit of measurement

## Files Modified

### 1. Database Schema (`prisma/schema.prisma`)
```prisma
model Product {
  // ... existing fields
  isCountable  Boolean   @default(true) @map("is_countable")
  unit         String    @default("pcs")
  // ... remaining fields
}
```

**Migration Created**: `20251121230316_add_is_countable_and_unit_to_product`

### 2. Domain Layer

#### `src/domain/entities/Product.ts`
- Added `isCountable: boolean` parameter to constructor
- Added `unit: string` parameter to constructor
- Updated `isInStock()` logic to check `isCountable` flag
- Updated `canDecreaseStock()` logic to check `isCountable` flag

**New Logic**:
- Non-countable products (isCountable = false) are always considered "in stock"
- Non-countable products can always be sold (no stock validation)

### 3. Infrastructure Layer

#### `src/infrastructure/repositories/PrismaProductRepository.ts`
- Added `is_countable` and `unit` to field mapping
- Added `isCountable` and `unit` to valid sort fields
- Updated `inStock` filter logic to consider `isCountable` flag
- Updated `create()` method to accept optional `isCountable` and `unit` parameters
- Updated `update()` method to handle `isCountable` and `unit` updates
- Updated `mapToEntity()` to map new fields with defaults (true for isCountable, "pcs" for unit)

**Improved Stock Filtering**:
```typescript
// Products considered "in stock":
- Services (type = 'service')
- Non-countable products (isCountable = false)
- Countable goods with stock > 0
- Countable goods without stock tracking (stock = null)

// Products considered "out of stock":
- Countable goods (isCountable = true) with stock <= 0
```

### 4. Presentation Layer

#### `src/presentation/dto/ProductRequestDTO.ts`

**createProductSchema**:
- Added `is_countable: yup.boolean().optional().default(true)`
- Added `unit: yup.string().optional().default('pcs')`

**updateProductSchema**:
- Added `is_countable: yup.boolean().optional()`
- Added `unit: yup.string().optional()`

#### `src/presentation/dto/ProductResponseDTO.ts`

**ProductResponse Interface**:
- Added `is_countable: boolean`
- Added `unit: string`

**ProductListResponse Interface**:
- Added `is_countable: boolean`
- Added `unit: string`

**Response Mappers**:
- Updated `toProductResponse()` to include new fields
- Updated `toProductListResponse()` to include new fields

#### `src/presentation/controllers/ProductController.ts`

**createProduct()**:
- Added `isCountable: validatedData.is_countable ?? true`
- Added `unit: validatedData.unit ?? 'pcs'`

**updateProduct()**:
- Added conditional update for `isCountable` field
- Added conditional update for `unit` field

## API Usage Examples

### Create Product with New Fields

**Request**:
```json
POST /api/v2/tenants/{tenantId}/products
{
  "name": "Bottled Water",
  "price": 5000,
  "type": "good",
  "stock": 100,
  "productCategoryId": "category-uuid",
  "is_countable": true,
  "unit": "bottles"
}
```

**Request (Non-countable product)**:
```json
POST /api/v2/tenants/{tenantId}/products
{
  "name": "Consultation Service",
  "price": 500000,
  "type": "service",
  "productCategoryId": "category-uuid",
  "is_countable": false,
  "unit": "session"
}
```

### Update Product Fields

**Request**:
```json
PATCH /api/v2/tenants/{tenantId}/products/{productId}
{
  "is_countable": false,
  "unit": "kg"
}
```

### Response Example

```json
{
  "meta": {
    "message": "Product created successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": {
    "product": {
      "id": "product-uuid",
      "tenant_id": "tenant-uuid",
      "name": "Bottled Water",
      "description": null,
      "price": 5000,
      "type": "good",
      "stock": 100,
      "sku": null,
      "image_url": null,
      "alias": null,
      "product_category_id": "category-uuid",
      "is_countable": true,
      "unit": "bottles",
      "created_at": "2025-11-22T00:00:00.000Z",
      "updated_at": "2025-11-22T00:00:00.000Z",
      "formatted_price": "Rp5.000",
      "is_in_stock": true,
      "is_service": false,
      "is_good": true
    }
  },
  "pagination": null
}
```

## Use Cases

### 1. Weight-based Products
```json
{
  "name": "Rice",
  "is_countable": false,
  "unit": "kg"
}
```
- Stock not tracked by quantity
- Always available (manual inventory management)

### 2. Countable Products
```json
{
  "name": "T-Shirt",
  "is_countable": true,
  "unit": "pcs",
  "stock": 50
}
```
- Stock tracked by quantity
- Decreases with each sale

### 3. Services
```json
{
  "name": "Haircut",
  "type": "service",
  "is_countable": false,
  "unit": "session"
}
```
- No stock tracking
- Always available

### 4. Volume-based Products
```json
{
  "name": "Milk",
  "is_countable": false,
  "unit": "liters"
}
```
- Not tracked by discrete units
- Manual inventory management

## Benefits

1. **Flexible Inventory Management**: Supports both countable and non-countable products
2. **Custom Units**: Allows specifying measurement units (pcs, kg, liters, meters, etc.)
3. **Better Reporting**: Unit information enhances reports and invoices
4. **Backward Compatible**: Defaults ensure existing products work without changes
5. **Improved Stock Logic**: Non-countable products won't trigger "out of stock" warnings

## Migration Notes

- **Existing Products**: Automatically set to `isCountable: true` and `unit: "pcs"`
- **Database**: Migration applied successfully with default values
- **Backward Compatible**: V1 endpoints unaffected (if they exist)
- **V2 Only**: Changes only applied to V2 API endpoints

## Testing Recommendations

1. Create products with different unit types
2. Test stock filtering with countable vs non-countable products
3. Verify update operations work for new fields
4. Test listing products sorted by unit
5. Verify backward compatibility with existing products
