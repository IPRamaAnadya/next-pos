# Expense API v3

Base path: `/api/v3`

All endpoints require a valid JWT in `Authorization: Bearer <token>`.

---

## Expense Categories

### `GET /expense-categories`
List expense categories for the tenant.

**Query params:** `page`, `pageSize`, `search` (name or code), `isPrivate` (true|false)

**Response:**
```json
{
  "meta": { "success": true, "message": "OK", "code": 200 },
  "data": [
    { "id": "uuid", "tenantId": "uuid", "name": "Office Supplies", "code": "OFFICE", "isPrivate": false, "createdAt": "..." }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### `POST /expense-categories`
Create an expense category. **Owner only.**

**Body:**
```json
{ "name": "Office Supplies", "code": "OFFICE", "isPrivate": false }
```
- `code` — alphanumeric + underscores only, automatically uppercased, must be unique per tenant

---

### `GET /expense-categories/:categoryId`
Get a single expense category.

---

### `PUT /expense-categories/:categoryId`
Update an expense category. **Owner only.** All fields optional.

**Body:**
```json
{ "name": "Office & Stationery", "code": "OFFICE_STAT", "isPrivate": true }
```

---

### `DELETE /expense-categories/:categoryId`
Delete an expense category. **Owner only.** Blocked if the category has any expenses.

---

## Expenses

### `GET /expenses`
List expenses for the tenant.

**Query params:**
- `page`, `pageSize`
- `search` — description (case-insensitive)
- `expenseCategoryId`, `staffId`, `paymentType`
- `isShow` — `true` | `false`
- `isPaid` — `true` | `false`
- `startDate`, `endDate` — ISO date strings (YYYY-MM-DD), filter by `createdAt`
- `minAmount`, `maxAmount`

**Response:**
```json
{
  "meta": { "success": true, "message": "OK", "code": 200 },
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "expenseCategoryId": "uuid",
      "staffId": "uuid",
      "description": "Printer paper",
      "amount": 150000,
      "paymentType": "Cash",
      "isShow": true,
      "isPaid": true,
      "paidAt": "2026-04-01T09:00:00.000Z",
      "attachmentUrl": null,
      "payrollDetailId": null,
      "createdAt": "...",
      "expenseCategory": { "id": "uuid", "name": "Office Supplies", "code": "OFFICE", "isPrivate": false, "tenantId": "uuid", "createdAt": "..." },
      "staff": { "id": "uuid", "username": "john", "role": "MANAGER" }
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 10, "totalPages": 1 }
}
```

---

### `POST /expenses`
Create an expense.

**Body:**
```json
{
  "expenseCategoryId": "uuid",
  "staffId": "uuid",
  "description": "Printer paper purchase",
  "amount": 150000,
  "paymentType": "Cash",
  "isShow": true,
  "paidAt": "2026-04-01T09:00:00.000Z",
  "attachmentUrl": "https://...",
  "payrollDetailId": null
}
```
- `paymentType`: `Cash` | `Bank Transfer` | `Credit Card` | `Debit Card` | `E-Wallet` (default: `Cash`)
- `amount` must be > 0
- `expenseCategoryId` must exist in the tenant

---

### `GET /expenses/:expenseId`
Get a single expense (includes category and staff).

---

### `PUT /expenses/:expenseId`
Update an expense. All fields optional.

**Body (same fields as POST, all optional)**

---

### `DELETE /expenses/:expenseId`
Delete an expense. **Owner only.**

---

### `PUT /expenses/:expenseId/paid`
Mark an expense as paid.

**Body (optional):**
```json
{ "paidAt": "2026-04-01T09:00:00.000Z" }
```
- `paidAt` defaults to current timestamp if omitted
- Returns error if already paid

---

### `DELETE /expenses/:expenseId/paid`
Mark an expense as unpaid (clears `paidAt`). Returns error if not currently paid.
