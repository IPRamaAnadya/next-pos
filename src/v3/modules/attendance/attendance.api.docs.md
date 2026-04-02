# Attendance API v3

Base path: `/api/v3`

All endpoints require a valid JWT in `Authorization: Bearer <token>`.

---

### `GET /attendance`
List attendance records for the tenant.

**Query params:**
- `page`, `pageSize`
- `staffId` — filter by staff
- `startDate`, `endDate` — ISO date strings (YYYY-MM-DD)
- `isWeekend` — `true` | `false`

**Response:**
```json
{
  "meta": { "success": true, "message": "OK", "code": 200 },
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "staffId": "uuid",
      "shiftId": null,
      "date": "2026-04-01T00:00:00.000Z",
      "checkInTime": "08:00",
      "checkOutTime": "17:00",
      "totalHours": 9,
      "isWeekend": false,
      "staff": { "id": "uuid", "username": "john", "role": "MANAGER" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 30, "totalPages": 2 }
}
```

---

### `POST /attendance/check-in`
Record a check-in. Creates a new attendance record or updates an existing one without check-in.

**Body:**
```json
{
  "staffId": "uuid",
  "checkInTime": "08:00",
  "date": "2026-04-01",
  "shiftId": "uuid",
  "isWeekend": false
}
```
- `date` — optional, defaults to today (UTC)
- `checkInTime` — required, `HH:mm` format
- Prevents duplicate check-in for the same staff on the same date

---

### `POST /attendance/check-out`
Record a check-out. Automatically calculates `totalHours`.

**Body:**
```json
{
  "attendanceId": "uuid",
  "checkOutTime": "17:00"
}
```
- `checkOutTime` — required, `HH:mm` format
- Supports midnight-crossing (e.g. check-in `22:00`, check-out `06:00` → 8 hours)

---

### `GET /attendance/:attendanceId`
Get a single attendance record.

---

### `PUT /attendance/:attendanceId`
Manually update an attendance record. **Owner only.**

**Body (all optional):**
```json
{
  "checkInTime": "08:30",
  "checkOutTime": "17:30",
  "shiftId": "uuid",
  "isWeekend": false,
  "totalHours": 9
}
```
- `totalHours` is auto-recalculated if `checkInTime` / `checkOutTime` are provided and `totalHours` is omitted

---

### `DELETE /attendance/:attendanceId`
Delete an attendance record. **Owner only.**
