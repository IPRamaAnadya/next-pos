# Staff API v3

Base path: `/api/v3`

All endpoints require a valid JWT in `Authorization: Bearer <token>`.

---

## Staff

### `GET /staff`
List all staff for the tenant.

**Query params:** `page`, `pageSize`, `search` (username), `role` (MANAGER|CASHIER), `isOwner` (true|false)

**Response:**
```json
{
  "meta": { "success": true, "message": "OK", "code": 200 },
  "data": [
    { "id": "uuid", "tenantId": "uuid", "isOwner": false, "role": "MANAGER", "username": "john", "salary": null, "createdAt": "...", "updatedAt": "..." }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### `POST /staff`
Create a new staff member. **Owner only.**

**Body:**
```json
{
  "username": "john",
  "password": "secret123",
  "role": "MANAGER",
  "isOwner": false
}
```
- `role`: `MANAGER` | `CASHIER`

---

### `GET /staff/:staffId`
Get single staff member.

---

### `PUT /staff/:staffId`
Update staff. **Owner only.**

**Body (all optional):**
```json
{ "username": "newname", "password": "newpass", "role": "CASHIER" }
```

---

### `DELETE /staff/:staffId`
Delete staff. **Owner only.** Blocked if staff is owner.

---

## Salary

### `GET /staff/:staffId/salary`
Get salary record for a staff member. Returns `null` if not set.

---

### `PUT /staff/:staffId/salary`
Create or update salary. **Owner only.**

**Body:**
```json
{
  "basicSalary": 5000000,
  "fixedAllowance": 500000,
  "type": "MONTHLY"
}
```
- `type`: `MONTHLY` | `HOURLY` (default: `MONTHLY`)

---

### `DELETE /staff/:staffId/salary`
Delete salary record. **Owner only.**

---

## Leaves

### `GET /staff/:staffId/leaves`
List leaves for a staff member.

**Query params:** `type` (SICK|LEAVE|PERMIT|ABSENT|OTHER)

---

### `POST /staff/:staffId/leaves`
Create a leave record.

**Body:**
```json
{
  "type": "SICK",
  "reason": "Flu",
  "startDate": "2026-04-01",
  "endDate": "2026-04-02"
}
```
- `type`: `SICK` | `LEAVE` | `PERMIT` | `ABSENT` | `OTHER`

---

### `GET /staff/:staffId/leaves/:leaveId`
Get a single leave record.

---

### `PUT /staff/:staffId/leaves/:leaveId`
Update a leave record.

**Body (all optional):**
```json
{ "type": "LEAVE", "reason": "Vacation", "startDate": "2026-04-05", "endDate": "2026-04-08" }
```

---

### `DELETE /staff/:staffId/leaves/:leaveId`
Delete a leave record.
