# Order API v2 - Clean Architecture Implementation

This is a complete refactoring of the order API using Clean Architecture principles. The new implementation is scalable, maintainable, and follows best practices.

## Architecture Overview

The implementation follows a 4-layer architecture:

```
src/
├── domain/                    # Domain Layer (Entities, Repository Interfaces, Domain Errors)
│   ├── entities/
│   │   └── Order.ts          # Order domain entities and interfaces
│   ├── repositories/
│   │   └── OrderRepository.ts # Repository interfaces
│   └── errors/
│       └── OrderErrors.ts    # Domain-specific errors
├── application/               # Application Layer (Use Cases)
│   └── use-cases/
│       ├── GetOrdersUseCase.ts
│       ├── GetOrderByIdUseCase.ts
│       ├── CreateOrderUseCase.ts
│       ├── UpdateOrderUseCase.ts
│       └── DeleteOrderUseCase.ts
├── infrastructure/            # Infrastructure Layer (External Dependencies)
│   ├── repositories/
│   │   ├── PrismaOrderRepository.ts
│   │   └── PrismaCustomerRepository.ts
│   └── services/
│       ├── OrderNotificationServiceImpl.ts
│       └── SubscriptionLimitServiceImpl.ts
└── app/api/v2/               # Presentation Layer (Controllers, DTOs, Routes)
    ├── controllers/
    │   └── OrderController.ts
    ├── dto/
    │   ├── OrderRequestDTO.ts
    │   └── OrderResponseDTO.ts
    └── tenants/[tenantId]/orders/
        ├── route.ts          # GET /orders, POST /orders
        ├── route.test.ts     # Unit tests
        └── [id]/
            └── route.ts      # GET, PUT, DELETE /orders/[id]
```

## Key Benefits

### 1. **Separation of Concerns**
- **Domain Layer**: Contains business logic and rules
- **Application Layer**: Contains use cases and application services
- **Infrastructure Layer**: Contains external dependencies (database, notifications)
- **Presentation Layer**: Contains API controllers and DTOs

### 2. **Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Easy to swap implementations without affecting business logic

### 3. **Testability**
- Each layer can be tested independently
- Dependencies are injected and can be mocked
- Business logic is isolated from external concerns

### 4. **Scalability**
- Easy to add new features without affecting existing code
- Clear boundaries between layers
- Consistent error handling and response format

### 5. **Maintainability**
- Code is organized by business functionality
- Changes in one layer don't affect others
- Clear naming conventions and structure

## API Endpoints

### Base URL: `/api/v2/tenants/{tenantId}/orders`

All endpoints require JWT authorization header: `Authorization: Bearer <token>`

### 1. Get Orders (List)
```
GET /api/v2/tenants/{tenantId}/orders
```

**Query Parameters:**
- `p_limit` (optional): Number of items per page (1-100, default: 5)
- `p_page` (optional): Page number (default: 1)
- `p_order_status` (optional): Filter by order status
- `p_payment_status` (optional): Filter by payment status
- `p_customer_name` (optional): Filter by customer name
- `p_customer_id` (optional): Filter by customer ID
- `p_sort_by` (optional): Sort field (default: created_at)
- `p_sort_dir` (optional): Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "meta": {
    "message": "Orders retrieved successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNo": "string",
        "grandTotal": 100000,
        "customerName": "John Doe",
        "createdAt": "2025-01-01T00:00:00Z",
        "orderStatus": "completed",
        "paymentStatus": "paid"
      }
    ],
    "pagination": {
      "total_data": 100,
      "per_page": 5,
      "current_page": 1,
      "total_page": 20,
      "next_page": 2,
      "prev_page": null
    }
  },
  "pagination": null
}
```

### 2. Get Order by ID
```
GET /api/v2/tenants/{tenantId}/orders/{orderId}
```

**Response:**
```json
{
  "meta": {
    "message": "Order retrieved successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": {
    "order": {
      "id": "uuid",
      "tenantId": "uuid",
      "orderNo": "string",
      "grandTotal": 100000,
      "subtotal": 90000,
      "totalAmount": 100000,
      "paidAmount": 100000,
      "remainingBalance": 0,
      "change": 0,
      "taxAmount": 10000,
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "orderStatus": "completed",
      "paymentDate": "2025-01-01T00:00:00Z",
      "note": "Special instructions",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "customerId": "uuid",
      "customerName": "John Doe",
      "discountId": "uuid",
      "discountName": "10% Off",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 10000,
      "discountRewardType": "cash",
      "pointUsed": 0,
      "staffId": "uuid",
      "lastPointsAccumulation": 100,
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productName": "Product Name",
          "productPrice": 50000,
          "qty": 2,
          "totalPrice": 100000,
          "createdAt": "2025-01-01T00:00:00Z",
          "updatedAt": "2025-01-01T00:00:00Z"
        }
      ]
    }
  },
  "pagination": null
}
```

### 3. Create Order
```
POST /api/v2/tenants/{tenantId}/orders
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerId": "uuid",
  "discountId": "uuid",
  "discountName": "10% Off",
  "discountType": "percentage",
  "discountRewardType": "cash",
  "discountValue": 10,
  "discountAmount": 10000,
  "subtotal": 90000,
  "taxAmount": 10000,
  "totalAmount": 100000,
  "grandTotal": 100000,
  "pointUsed": 0,
  "paidAmount": 100000,
  "change": 0,
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "orderStatus": "completed",
  "staffId": "uuid",
  "note": "Special instructions",
  "orderItems": [
    {
      "productId": "uuid",
      "productName": "Product Name",
      "productPrice": 50000,
      "qty": 2
    }
  ]
}
```

**Response:** Same as Get Order by ID

### 4. Update Order
```
PUT /api/v2/tenants/{tenantId}/orders/{orderId}
```

**Request Body:** Same as Create Order (all fields required)

**Response:** Same as Get Order by ID

### 5. Delete Order
```
DELETE /api/v2/tenants/{tenantId}/orders/{orderId}
```

**Response:**
```json
{
  "meta": {
    "message": "Order deleted successfully",
    "success": true,
    "code": 200,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

## Error Handling

All errors follow a consistent format using the `apiResponse` utility:

```json
{
  "meta": {
    "message": "Error message",
    "success": false,
    "code": 400,
    "errors": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ]
  },
  "data": null,
  "pagination": null
}
```

### Common Error Codes:
- `400`: Validation errors
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (tenant mismatch, order status restrictions, subscription limits)
- `404`: Order not found
- `500`: Internal server error

## Business Rules

### Order Creation
1. **Subscription Limits**: Enforces tenant transaction limits
2. **Order Number Generation**: Auto-generates unique order numbers
3. **Payment Date**: Automatically set when `paymentStatus` is "paid"
4. **Remaining Balance**: Calculated as `grandTotal - paidAmount`
5. **Change**: Calculated as `paidAmount - grandTotal` (if positive)
6. **Customer Points**: Automatically handles point deduction and rewards
7. **Notifications**: Sends order notifications asynchronously

### Order Updates
1. **Payment Date**: Set when status changes from unpaid to paid
2. **Order Items**: Completely replaced with new items
3. **Customer Points**: Handled based on current order state
4. **Notifications**: Sent based on payment status

### Order Deletion
1. **Status Check**: Cannot delete completed orders
2. **Point Reversal**: Automatically reverses customer point changes
3. **Cascade Delete**: Removes all associated order items

## Testing

Run the test suite:
```bash
npm test src/app/api/v2/tenants/[tenantId]/orders/route.test.ts
```

## Migration from v1

The v2 API is fully backward compatible in terms of functionality but uses a different URL structure:

**v1:** `/api/tenants/{tenantId}/orders`
**v2:** `/api/v2/tenants/{tenantId}/orders`

### Key Differences:
1. **Consistent Response Format**: All responses use the `apiResponse` utility
2. **Better Error Handling**: Proper error codes and messages
3. **Type Safety**: Full TypeScript support throughout
4. **Validation**: Comprehensive request validation using Yup
5. **Clean Architecture**: Separation of concerns and dependency inversion
6. **Testability**: Comprehensive unit tests

## Future Enhancements

1. **Caching**: Add Redis caching for order queries
2. **Event Sourcing**: Track order state changes
3. **Async Processing**: Move heavy operations to background jobs
4. **Rate Limiting**: Add API rate limiting per tenant
5. **Audit Logging**: Track all order operations
6. **Bulk Operations**: Support bulk order creation/updates
7. **GraphQL**: Add GraphQL API alongside REST
8. **Real-time Updates**: WebSocket support for order status updates