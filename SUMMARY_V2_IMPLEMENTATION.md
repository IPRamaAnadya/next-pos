# Summary Feature V2 Implementation Guide

## Overview
Complete implementation of the Summary feature following Clean Architecture principles with UTC datetime handling and optimized database queries.

## Implementation Date
Created: 2025

## Architecture Layers

### 1. Domain Layer (`/src/domain`)

#### Entities (`/src/domain/entities/Summary.ts`)
Defines core business data structures:

- **DailyOrderSummary**: Daily aggregated metrics (orders, revenue, expenses, payments, net profit)
- **PaymentMethodSummary**: Payment method and expense type breakdowns with date range
- **TodayOrdersSummary**: Today's orders with customer information
- **TodayExpensesSummary**: Today's total expenses
- **TopCustomersSummary**: Top customers by spending with order counts
- **DailyPaymentReceivedSummary**: Total payments received in date range

#### Repository Interface (`/src/domain/repositories/SummaryRepository.ts`)
Defines data access contract with methods:

- `getDailyOrders(tenantId, startDate, endDate)` - Daily aggregated summaries
- `getPaymentMethodSummary(tenantId, startDate, endDate)` - Payment breakdowns
- `getTodayOrders(tenantId, todayStart, todayEnd)` - Today's order list
- `getTodayExpenses(tenantId, todayStart)` - Today's expense total
- `getTopCustomers(tenantId, startDate, endDate, limit)` - Top spending customers
- `getDailyPaymentReceived(tenantId, startDate, endDate)` - Payment totals

**Key Design Decision**: All dates are passed as UTC `Date` objects, eliminating timezone confusion.

### 2. Application Layer (`/src/application`)

#### Use Cases (`/src/application/use-cases/SummaryUseCases.ts`)
Business logic implementations:

- `GetDailyOrdersSummaryUseCase` - Retrieves daily order aggregations
- `GetPaymentMethodSummaryUseCase` - Calculates payment method breakdowns
- `GetTodayOrdersUseCase` - Fetches today's orders
- `GetTodayExpensesUseCase` - Calculates today's expenses
- `GetTopCustomersUseCase` - Identifies top customers
- `GetDailyPaymentReceivedUseCase` - Aggregates payment totals

Each use case:
- Accepts repository via constructor injection
- Delegates to repository methods
- Returns domain entities

#### Service Container (`/src/application/services/SummaryServiceContainer.ts`)
Dependency injection container:

- Singleton pattern for all services
- Initializes `PrismaSummaryRepository` with Prisma client
- Creates and caches all use case instances
- Provides `SummaryController` singleton

**Pattern**: Follows established container pattern from `AuthServiceContainer`.

### 3. Infrastructure Layer (`/src/infrastructure`)

#### Repository Implementation (`/src/infrastructure/repositories/PrismaSummaryRepository.ts`)
Optimized Prisma queries implementing `SummaryRepository` interface.

**Key Optimizations**:

1. **Parallel Query Execution**: Uses `Promise.all()` to fetch related data concurrently
   ```typescript
   const [orders, expenses, payments] = await Promise.all([...]);
   ```

2. **Efficient Aggregations**: Uses Prisma's `groupBy` and `aggregate` for database-level calculations
   ```typescript
   await prisma.order.groupBy({
     by: ['paymentMethod'],
     _sum: { grandTotal: true }
   });
   ```

3. **Avoid N+1 Queries**: Fetches related customers in single batch query
   ```typescript
   const customers = await prisma.customer.findMany({
     where: { id: { in: customerIds } }
   });
   ```

4. **In-Memory Grouping**: Groups data by date using Map for efficient lookups
   ```typescript
   const dailyData = new Map<string, DailyOrderSummary>();
   ```

5. **Null Safety**: Guards against null dates and values throughout

**Removed**: All timezone conversion logic (`getUtcFromLocal`, `toUtcFromTz`, `X-Timezone-Name` header).

### 4. Presentation Layer (`/src/presentation`)

#### Request DTOs (`/src/presentation/dto/SummaryRequestDTO.ts`)
Yup validation schemas:

- `summaryDateRangeSchema` - Validates startDate and endDate as ISO UTC strings
- `todayQuerySchema` - Validates todayStart and todayEnd
- `topCustomerQuerySchema` - Extends date range with optional limit parameter

**Validation Rules**:
- ISO datetime format validation
- End date must be >= start date
- Limit must be positive integer (default: 20)

#### Response DTOs (`/src/presentation/dto/SummaryResponseDTO.ts`)
Mapper functions converting domain entities to API responses:

- `mapDailyOrdersSummaryResponse()` - Maps to snake_case array
- `mapPaymentMethodSummaryResponse()` - Includes payment and expense breakdowns
- `mapTodayOrdersSummaryResponse()` - Maps orders with customer names
- `mapTodayExpensesSummaryResponse()` - Simple total amount response
- `mapTopCustomersSummaryResponse()` - Customer list with spending metrics
- `mapDailyPaymentReceivedSummaryResponse()` - Total with date range

**Naming Convention**: API responses use snake_case for consistency with existing endpoints.

#### Controller (`/src/presentation/controllers/SummaryController.ts`)
HTTP request handlers:

**Features**:
- Singleton pattern with `getInstance()`
- JWT token verification via `verifyTenantAccess()`
- Query parameter flexibility: Supports both camelCase and snake_case
- Comprehensive error handling:
  - Validation errors (400)
  - Unauthorized access (401)
  - Internal server errors (500)

**Methods**:
- `getDailyOrders(req, tenantId)` - GET daily order summaries
- `getPaymentMethodSummary(req, tenantId)` - GET payment breakdowns
- `getTodayOrders(req, tenantId)` - GET today's orders
- `getTodayExpenses(req, tenantId)` - GET today's expenses
- `getTopCustomers(req, tenantId)` - GET top customers
- `getDailyPaymentReceived(req, tenantId)` - GET payment totals

### 5. API Routes (`/src/app/api/v2/tenants/[tenantId]/summaries/`)

Six endpoint routes following Next.js App Router pattern:

1. **`daily-orders/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/daily-orders?startDate={iso}&endDate={iso}`
   - Returns array of daily summaries with orders, revenue, expenses, net profit

2. **`payment-methods/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/payment-methods?startDate={iso}&endDate={iso}`
   - Returns payment method and expense type breakdowns

3. **`today-orders/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/today-orders?todayStart={iso}&todayEnd={iso}`
   - Returns today's orders with customer names

4. **`today-expenses/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/today-expenses?todayStart={iso}`
   - Returns today's total expenses

5. **`top-customers/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/top-customers?startDate={iso}&endDate={iso}&limit=20`
   - Returns top customers by spending

6. **`daily-payment-received/route.ts`**
   - GET `/api/v2/tenants/{tenantId}/summaries/daily-payment-received?startDate={iso}&endDate={iso}`
   - Returns total payments received

**Route Pattern**:
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const summaryController = getSummaryController();
  return await summaryController.methodName(req, tenantId);
}
```

## API Request/Response Examples

### Daily Orders Summary

**Request**:
```
GET /api/v2/tenants/tenant-123/summaries/daily-orders?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
Authorization: Bearer {jwt-token}
```

**Response**:
```json
{
  "meta": {
    "message": "Daily orders summary retrieved successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": [
    {
      "date": "2025-01-01",
      "total_orders": 15,
      "total_revenue": 1500000,
      "total_expenses": 300000,
      "total_payments_received": 1500000,
      "net_profit": 1200000
    }
  ],
  "pagination": null
}
```

### Payment Method Summary

**Request**:
```
GET /api/v2/tenants/tenant-123/summaries/payment-methods?start_date=2025-01-01T00:00:00.000Z&end_date=2025-01-31T23:59:59.999Z
Authorization: Bearer {jwt-token}
```

**Response**:
```json
{
  "meta": {
    "message": "Payment method summary retrieved successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": {
    "tenant_id": "tenant-123",
    "date_range": {
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-01-31T23:59:59.999Z"
    },
    "payment_breakdown": [
      {
        "payment_method": "cash",
        "total_amount": 800000
      },
      {
        "payment_method": "card",
        "total_amount": 700000
      }
    ],
    "expense_breakdown": [
      {
        "payment_type": "cash",
        "total_amount": 200000
      }
    ]
  },
  "pagination": null
}
```

### Top Customers

**Request**:
```
GET /api/v2/tenants/tenant-123/summaries/top-customers?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z&limit=10
Authorization: Bearer {jwt-token}
```

**Response**:
```json
{
  "meta": {
    "message": "Top customers retrieved successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": {
    "customers": [
      {
        "customer_id": "cust-1",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+6281234567890",
        "total_spent": 5000000,
        "orders_count": 25
      }
    ],
    "date_range": {
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-01-31T23:59:59.999Z"
    }
  },
  "pagination": null
}
```

## Key Improvements Over V1

### 1. UTC Datetime Handling
**Before**: Complex timezone conversions using `date-fns-tz`, `X-Timezone-Name` header
**After**: Client sends UTC datetimes, server processes directly without conversion

**Migration**: Frontend must convert local times to UTC before API calls.

### 2. Query Optimization
**Before**: Multiple sequential queries, potential N+1 problems
**After**: 
- Parallel query execution
- Database-level aggregations
- Batch fetching of related data

### 3. Clean Architecture
**Before**: Mixed business logic in route handlers
**After**: Proper separation of concerns across 4 layers

### 4. Type Safety
**Before**: Direct Prisma types in routes
**After**: Domain entities → DTOs → API responses with full TypeScript coverage

### 5. Validation
**Before**: Manual parameter validation
**After**: Yup schemas with comprehensive validation rules

### 6. Error Handling
**Before**: Generic error responses
**After**: Structured error responses with field-level validation errors

## Testing Recommendations

### Unit Tests
1. Repository methods (mock Prisma client)
2. Use case logic
3. DTO mappers
4. Validation schemas

### Integration Tests
1. Full request/response cycle per endpoint
2. Authorization scenarios
3. Date range edge cases
4. Pagination and limits

### Performance Tests
1. Large date ranges
2. High volume data aggregation
3. Concurrent request handling

## Monitoring & Observability

Recommended metrics:
- Query execution times by endpoint
- Cache hit rates (if caching added)
- Error rates by type
- API response times

Logging points:
- Validation failures with field details
- Authorization failures with tenant ID
- Database query errors with context

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed date ranges
2. **Pagination**: Add pagination to daily-orders endpoint for large ranges
3. **Aggregation Intervals**: Support weekly/monthly aggregations
4. **Export**: Add CSV/PDF export functionality
5. **Real-time Updates**: WebSocket support for live summary updates
6. **Comparison**: Add year-over-year or period-over-period comparisons
7. **Filtering**: Add product category, staff member, or payment method filters

## Migration from V1

### Step 1: Update Frontend Datetime Handling
```typescript
// Old (V1)
const startDate = '2025-01-01'; // Local date string
fetch(`/api/tenants/${tenantId}/summaries/daily-order?start_date=${startDate}`, {
  headers: { 'X-Timezone-Name': 'Asia/Jakarta' }
});

// New (V2)
const startDate = new Date('2025-01-01').toISOString(); // UTC ISO string
fetch(`/api/v2/tenants/${tenantId}/summaries/daily-orders?startDate=${startDate}`);
```

### Step 2: Update API Paths
- `/api/tenants/{id}/summaries/daily-order` → `/api/v2/tenants/{id}/summaries/daily-orders`
- `/api/tenants/{id}/summaries/payment-method` → `/api/v2/tenants/{id}/summaries/payment-methods`
- Add `s` to plural endpoints for consistency

### Step 3: Update Response Parsing
Response structure remains similar, but verify field names match documentation.

### Step 4: Remove Timezone Headers
No longer send `X-Timezone-Name` header to V2 endpoints.

## Files Created

### Domain Layer
- `/src/domain/entities/Summary.ts`
- `/src/domain/repositories/SummaryRepository.ts`

### Application Layer
- `/src/application/use-cases/SummaryUseCases.ts`
- `/src/application/services/SummaryServiceContainer.ts`

### Infrastructure Layer
- `/src/infrastructure/repositories/PrismaSummaryRepository.ts`

### Presentation Layer
- `/src/presentation/dto/SummaryRequestDTO.ts`
- `/src/presentation/dto/SummaryResponseDTO.ts`
- `/src/presentation/controllers/SummaryController.ts`

### API Routes
- `/src/app/api/v2/tenants/[tenantId]/summaries/daily-orders/route.ts`
- `/src/app/api/v2/tenants/[tenantId]/summaries/payment-methods/route.ts`
- `/src/app/api/v2/tenants/[tenantId]/summaries/today-orders/route.ts`
- `/src/app/api/v2/tenants/[tenantId]/summaries/today-expenses/route.ts`
- `/src/app/api/v2/tenants/[tenantId]/summaries/top-customers/route.ts`
- `/src/app/api/v2/tenants/[tenantId]/summaries/daily-payment-received/route.ts`

## Conclusion

The Summary V2 feature provides a robust, scalable, and maintainable implementation following Clean Architecture principles. All endpoints accept UTC datetimes, use optimized database queries, and return consistent API responses. The architecture supports easy testing, monitoring, and future enhancements.
