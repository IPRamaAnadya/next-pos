# Shift API v3

Base path: `/api/v3`

All endpoints require a valid JWT in `Authorization: Bearer <token>`.

---

### `GET /shifts`
List all shifts for the tenant.

**Query params:** `page`, `pageSize`, `search` (name), `isActive` (true|false)

**Response:**
```json
{
  "meta": { "success": true, "message": "OK", "code": 200 },
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Morning Shift",
      "startTime": "08:00",
      "endTime": "17:00",
      "isActive": true,
      "calculateBeforeStartTime": true,
      "hasBreakTime": false,
      "breakDuration": 0,
      "minWorkingHours": 8,
      "maxWorkingHours": 8,
      "overtimeMultiplier": 1.5,
      "lateThreshold": 15,
      "earlyCheckInAllowed": 30,
      "color": "#3B82F6",
      "description": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 }
}
```

---

### `POST /shifts`
Create a new shift. **Owner only.**

**Body:**
```json
{
  "name": "Morning Shift",
  "startTime": "08:00",
  "endTime": "17:00",
  "isActive": true,
  "calculateBeforeStartTime": true,
  "hasBreakTime": true,
  "breakDuration": 60,
  "minWorkingHours": 8,
  "maxWorkingHours": 9,
  "overtimeMultiplier": 1.5,
  "lateThreshold": 15,
  "earlyCheckInAllowed": 30,
  "color": "#3B82F6",
  "description": "Standard day shift"
}
```
- `name`, `startTime`, `endTime` are required
- Times must be in `HH:mm` format
- `name` must be unique per tenant

---

### `GET /shifts/active`
Get all active shifts (no pagination).

---

### `GET /shifts/:shiftId`
Get a single shift.

---

### `PUT /shifts/:shiftId`
Update a shift. **Owner only.** All fields optional.

**Body (same fields as POST, all optional)**

---

### `DELETE /shifts/:shiftId`
Delete a shift. **Owner only.** Blocked if the shift has any staff shift assignments.
