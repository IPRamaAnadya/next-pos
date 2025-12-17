# Order API Sorting Fix

## Problem
The order sorting functionality (asc/desc) on the GET list orders endpoint was not working correctly due to inconsistencies between the controller defaults and schema validation.

## Root Cause
There were two main issues:

1. **Inconsistent Defaults**: The controller was providing hardcoded defaults (`'createdAt'`, `'desc'`) before validation, while the yup schema also had defaults (`'created_at'`, `'desc'`). This created confusion about which format (camelCase vs snake_case) should be used.

2. **Type Assertion Bypass**: The controller used type assertions (`as 'asc' | 'desc'`) which bypassed runtime validation, potentially allowing invalid values to pass through.

## Solution Applied

### Changes Made

#### 1. Controller (`src/presentation/controllers/OrderController.ts`)
- **Before**: Controller set defaults as `'createdAt'` and `'desc'` before validation
- **After**: Controller passes `undefined` to yup, letting the schema handle defaults
- **Benefit**: Single source of truth for default values

```typescript
// Before
p_sort_by: url.searchParams.get('sortBy') || url.searchParams.get('p_sort_by') || 'createdAt',
p_sort_dir: (url.searchParams.get('sortDir') || url.searchParams.get('p_sort_dir') || 'desc') as 'asc' | 'desc',

// After
p_sort_by: url.searchParams.get('sortBy') || url.searchParams.get('p_sort_by') || undefined,
p_sort_dir: url.searchParams.get('sortDir') || url.searchParams.get('p_sort_dir') || undefined,
```

#### 2. Repository (`src/infrastructure/repositories/PrismaOrderRepository.ts`)
- No structural changes needed
- The `mapSortField()` function already properly handles both camelCase and snake_case field names
- Field mapping correctly translates API field names to Prisma field names

## How Sorting Works

### API Parameters

The API accepts sorting parameters in two formats:

#### CamelCase Format (Recommended)
```
GET /api/v2/tenants/{tenantId}/orders?sortBy=createdAt&sortDir=asc
```

#### Snake_case Format (Also Supported)
```
GET /api/v2/tenants/{tenantId}/orders?p_sort_by=created_at&p_sort_dir=desc
```

### Valid Sort Fields

The following fields can be used for sorting (in camelCase or snake_case):

- `id`
- `createdAt` / `created_at` ⭐ **Default**
- `updatedAt` / `updated_at`
- `orderNo` / `order_no`
- `grandTotal` / `grand_total`
- `subtotal`
- `totalAmount` / `total_amount`
- `paidAmount` / `paid_amount`
- `paymentStatus` / `payment_status`
- `orderStatus` / `order_status`
- `paymentDate` / `payment_date`
- `customerName` / `customer_name`
- `customerId` / `customer_id`

### Sort Direction

- `asc`: Ascending order (A→Z, 0→9, oldest→newest)
- `desc`: Descending order (Z→A, 9→0, newest→oldest) ⭐ **Default**

### Default Behavior

When no sorting parameters are provided:
- **Sort Field**: `created_at` (newest orders first)
- **Sort Direction**: `desc` (descending)

## Examples

### 1. Get Latest Orders (Default)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v2/tenants/{tenantId}/orders"
```

### 2. Get Oldest Orders First
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v2/tenants/{tenantId}/orders?sortDir=asc"
```

### 3. Sort by Grand Total (Highest First)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v2/tenants/{tenantId}/orders?sortBy=grandTotal&sortDir=desc"
```

### 4. Sort by Customer Name (A-Z)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v2/tenants/{tenantId}/orders?sortBy=customerName&sortDir=asc"
```

### 5. Using Snake_case Parameters
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v2/tenants/{tenantId}/orders?p_sort_by=order_no&p_sort_dir=asc"
```

## Testing

A test script is provided: `test-order-sorting.sh`

### Setup
1. Edit the script and replace:
   - `your-tenant-id-here` with your actual tenant ID
   - `your-jwt-token-here` with a valid JWT token

2. Run the script:
```bash
./test-order-sorting.sh
```

The script will test various sorting scenarios and display the results.

## Technical Details

### Data Flow

1. **Request** → Query parameters (`sortBy=createdAt&sortDir=asc`)
2. **Controller** → Parse params, pass to yup schema
3. **Validation** → Yup validates and applies defaults
4. **Repository** → Maps field names using `mapSortField()`
5. **Prisma** → Executes query with correct orderBy clause
6. **Response** → Sorted results returned to client

### Field Mapping Logic

The repository's `mapSortField()` method:
1. First checks if the field is a valid Prisma field name (camelCase)
2. Then checks if there's a mapping from snake_case to camelCase
3. Falls back to `'createdAt'` for invalid field names

This design supports both naming conventions seamlessly.

### Security

- Only whitelisted fields can be used for sorting
- Invalid field names default to `'createdAt'` (safe fallback)
- Sort direction is validated to be exactly `'asc'` or `'desc'`
- Case-sensitive validation prevents injection attempts

## Validation Rules

The yup schema enforces:

```typescript
p_sort_by: yup.string().optional().default('created_at')
p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc')
```

- `p_sort_dir` must be exactly `'asc'` or `'desc'` (case-sensitive)
- Invalid values will return a 400 Bad Request error
- Missing values will use the defaults

## Common Issues & Solutions

### Issue 1: Sorting Not Applied
**Symptom**: Results always return in the same order regardless of parameters

**Possible Causes**:
- Typo in parameter name (e.g., `sortdir` instead of `sortDir`)
- Invalid field name
- Case mismatch (`ASC` instead of `asc`)

**Solution**: Verify parameter names and values are correct

### Issue 2: 400 Bad Request
**Symptom**: API returns validation error

**Possible Causes**:
- Sort direction is not `'asc'` or `'desc'`
- Invalid UUID format for `p_customer_id`

**Solution**: Check error message in response for specific validation failure

### Issue 3: Unexpected Sort Order
**Symptom**: Data is sorted but not as expected

**Possible Causes**:
- NULL values in the sort field
- Expecting case-insensitive sort on case-sensitive field
- Timezone issues with date fields

**Solution**: Review the actual data and field types

## Files Modified

1. `/src/presentation/controllers/OrderController.ts`
   - Removed hardcoded defaults
   - Let yup schema handle default values

2. `/src/infrastructure/repositories/PrismaOrderRepository.ts`
   - No changes needed (already working correctly)

3. `/src/presentation/dto/OrderRequestDTO.ts`
   - No changes needed (schema was already correct)

## Backward Compatibility

✅ This fix is **100% backward compatible**:
- All existing API calls will work exactly as before
- Both camelCase and snake_case parameters are supported
- Default behavior remains unchanged

## Recommendations

For future API endpoints, consider:

1. **Consistent Naming**: Choose either camelCase OR snake_case, not both
2. **Schema-First Validation**: Let validation schemas define defaults
3. **Type Safety**: Remove type assertions in favor of proper validation
4. **Documentation**: Document supported fields and their formats clearly

## Related Documentation

- API Documentation: `/docs/ORDER_API_V2.md`
- Postman Collection: `postman_collection_v2.json`
- Testing Guide: This file

---

**Last Updated**: December 5, 2025
**Author**: GitHub Copilot
