# Summary API V2 Quick Reference

## Base URL
```
/api/v2/tenants/{tenantId}/summaries
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {your-jwt-token}
```

## Endpoints

### 1. Daily Orders Summary
**Endpoint**: `GET /daily-orders`

**Query Parameters**:
- `startDate` (required): ISO UTC datetime string (e.g., `2025-01-01T00:00:00.000Z`)
- `endDate` (required): ISO UTC datetime string (e.g., `2025-01-31T23:59:59.999Z`)

**Alternative Parameters** (backward compatible):
- `start_date` instead of `startDate`
- `end_date` instead of `endDate`

**Response Fields**:
```typescript
{
  data: [
    {
      date: string;              // YYYY-MM-DD format
      total_orders: number;
      total_revenue: number;
      total_expenses: number;
      total_payments_received: number;
      net_profit: number;
    }
  ]
}
```

---

### 2. Payment Method Summary
**Endpoint**: `GET /payment-methods`

**Query Parameters**:
- `startDate` (required): ISO UTC datetime
- `endDate` (required): ISO UTC datetime

**Response Fields**:
```typescript
{
  data: {
    tenant_id: string;
    date_range: {
      start_date: string;  // ISO string
      end_date: string;    // ISO string
    };
    payment_breakdown: [
      {
        payment_method: string;
        total_amount: number;
      }
    ];
    expense_breakdown: [
      {
        payment_type: string;
        total_amount: number;
      }
    ];
  }
}
```

---

### 3. Today's Orders
**Endpoint**: `GET /today-orders`

**Query Parameters**:
- `todayStart` (required): ISO UTC datetime for start of today
- `todayEnd` (required): ISO UTC datetime for end of today

**Alternative Parameters**:
- `today_start` instead of `todayStart`
- `today_end` instead of `todayEnd`

**Response Fields**:
```typescript
{
  data: {
    orders: [
      {
        grand_total: number;
        payment_date: string | null;  // ISO string
        customer_name: string | null;
      }
    ];
    total_orders: number;
    total_revenue: number;
  }
}
```

---

### 4. Today's Expenses
**Endpoint**: `GET /today-expenses`

**Query Parameters**:
- `todayStart` (required): ISO UTC datetime for start of today

**Alternative Parameters**:
- `today_start` instead of `todayStart`

**Response Fields**:
```typescript
{
  data: {
    total_amount: number;
    date: string;  // ISO string
  }
}
```

---

### 5. Top Customers
**Endpoint**: `GET /top-customers`

**Query Parameters**:
- `startDate` (required): ISO UTC datetime
- `endDate` (required): ISO UTC datetime
- `limit` (optional): Number of customers to return (default: 20)

**Alternative Parameters**:
- `start_date` instead of `startDate`
- `end_date` instead of `endDate`

**Response Fields**:
```typescript
{
  data: {
    customers: [
      {
        customer_id: string;
        name: string;
        email: string | null;
        phone: string | null;
        total_spent: number;
        orders_count: number;
      }
    ];
    date_range: {
      start_date: string;  // ISO string
      end_date: string;    // ISO string
    };
  }
}
```

---

### 6. Daily Payment Received
**Endpoint**: `GET /daily-payment-received`

**Query Parameters**:
- `startDate` (required): ISO UTC datetime
- `endDate` (required): ISO UTC datetime

**Alternative Parameters**:
- `start_date` instead of `startDate`
- `end_date` instead of `endDate`

**Response Fields**:
```typescript
{
  data: {
    total_payment_received: number;
    date_range: {
      start_date: string;  // ISO string
      end_date: string;    // ISO string
    };
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "meta": {
    "message": "Validation failed",
    "success": false,
    "code": 400,
    "errors": [
      {
        "field": "startDate",
        "message": "Start date is required"
      }
    ]
  },
  "data": null,
  "pagination": null
}
```

### Unauthorized (401)
```json
{
  "meta": {
    "message": "Tenant ID mismatch",
    "success": false,
    "code": 401,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

### Internal Server Error (500)
```json
{
  "meta": {
    "message": "Internal server error",
    "success": false,
    "code": 500,
    "errors": []
  },
  "data": null,
  "pagination": null
}
```

---

## JavaScript/TypeScript Examples

### Fetching Daily Orders
```typescript
async function getDailyOrders(tenantId: string, startDate: Date, endDate: Date) {
  const response = await fetch(
    `/api/v2/tenants/${tenantId}/summaries/daily-orders?` +
    `startDate=${startDate.toISOString()}&` +
    `endDate=${endDate.toISOString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch daily orders');
  }
  
  return await response.json();
}

// Usage
const start = new Date('2025-01-01T00:00:00.000Z');
const end = new Date('2025-01-31T23:59:59.999Z');
const data = await getDailyOrders('tenant-123', start, end);
```

### Fetching Top Customers
```typescript
async function getTopCustomers(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  limit = 20
) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: limit.toString(),
  });
  
  const response = await fetch(
    `/api/v2/tenants/${tenantId}/summaries/top-customers?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  const result = await response.json();
  return result.data.customers;
}
```

### Fetching Today's Summary
```typescript
async function getTodaySummary(tenantId: string) {
  // Get UTC start and end of today
  const now = new Date();
  const todayStart = new Date(now.setUTCHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setUTCHours(23, 59, 59, 999));
  
  const [orders, expenses] = await Promise.all([
    fetch(
      `/api/v2/tenants/${tenantId}/summaries/today-orders?` +
      `todayStart=${todayStart.toISOString()}&` +
      `todayEnd=${todayEnd.toISOString()}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json()),
    
    fetch(
      `/api/v2/tenants/${tenantId}/summaries/today-expenses?` +
      `todayStart=${todayStart.toISOString()}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json()),
  ]);
  
  return {
    orders: orders.data,
    expenses: expenses.data,
  };
}
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface DailyOrderSummary {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

function useDailyOrders(tenantId: string, startDate: Date, endDate: Date) {
  const [data, setData] = useState<DailyOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v2/tenants/${tenantId}/summaries/daily-orders?` +
          `startDate=${startDate.toISOString()}&` +
          `endDate=${endDate.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch daily orders');
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tenantId, startDate, endDate]);
  
  return { data, loading, error };
}

// Usage in component
function DashboardPage() {
  const { data, loading, error } = useDailyOrders(
    'tenant-123',
    new Date('2025-01-01'),
    new Date('2025-01-31')
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.map(day => (
        <div key={day.date}>
          <h3>{day.date}</h3>
          <p>Orders: {day.total_orders}</p>
          <p>Revenue: Rp {day.total_revenue.toLocaleString()}</p>
          <p>Net Profit: Rp {day.net_profit.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Important Notes

1. **UTC Datetime**: Always send dates in UTC ISO format. Convert local times to UTC in your frontend:
   ```typescript
   const utcDate = new Date(localDate).toISOString();
   ```

2. **Parameter Naming**: Both camelCase (`startDate`) and snake_case (`start_date`) are supported for backward compatibility.

3. **Date Ranges**: Ensure `endDate` is inclusive by setting time to end of day (23:59:59.999).

4. **Authorization**: JWT token must contain matching `tenantId` claim, otherwise 401 Unauthorized.

5. **Limit Parameter**: Default limit is 20 for top customers. Maximum recommended: 100.

6. **Performance**: For large date ranges (>90 days), consider pagination or aggregation by week/month.

7. **Caching**: Consider implementing client-side caching for frequently accessed date ranges.
