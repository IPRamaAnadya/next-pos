# Attendance System V2 with Backward Compatibility Implementation

## Overview

This document describes the implementation of the Attendance system V2 that maintains backward compatibility with existing attendance and payroll systems while introducing optional shift-based functionality.

## Architecture

The implementation follows Clean Architecture principles with 4 layers:

```
src/
├── domain/
│   ├── entities/
│   │   └── Attendance.ts                    # Enhanced with optional shift support
│   └── services/
│       └── AttendanceDomainService.ts       # Dual calculation methods
├── application/
│   ├── interfaces/
│   │   ├── AttendanceRepository.ts          # Repository interface
│   │   └── dto/
│   │       └── AttendanceDto.ts             # Request/Response DTOs
│   └── usecases/
│       └── AttendanceUseCases.ts            # Business logic with backward compatibility
├── infrastructure/
│   └── repositories/
│       └── PrismaAttendanceRepository.ts    # Database implementation
└── presentation/
    └── controllers/
        └── AttendanceController.ts          # HTTP handlers
```

## Key Features

### 1. **Backward Compatibility**
- ✅ Existing attendance records work without shift assignment
- ✅ Legacy calculation methods preserved
- ✅ Optional shift integration
- ✅ Dual calculation modes (legacy vs shift-based)

### 2. **Shift Integration**
- ✅ Optional shift assignment to attendance
- ✅ Shift-aware time calculations
- ✅ Late time calculation based on shift rules
- ✅ Overtime calculation with shift parameters
- ✅ Multiple shifts per day support

### 3. **Database Schema**
```sql
model Attendance {
  id           String    @id @default(uuid()) @db.Uuid
  tenantId     String    @map("tenant_id") @db.Uuid
  staffId      String    @map("staff_id") @db.Uuid
  shiftId      String?   @map("shift_id") @db.Uuid  // Optional for backward compatibility
  date         DateTime  @db.Date
  checkInTime  String?   @map("check_in_time")
  checkOutTime String?   @map("check_out_time")
  totalHours   Decimal?  @map("total_hours")
  isWeekend    Boolean?  @default(false) @map("is_weekend")
  createdAt    DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  tenant       Tenant    @relation(fields: [tenantId], references: [id])
  staff        Staff     @relation(fields: [staffId], references: [id])
  shift        Shift?    @relation(fields: [shiftId], references: [id])  // Optional relation
  
  @@index([tenantId, staffId, date])  // Composite index for queries
}
```

## API Endpoints

### Core Attendance Operations

#### 1. **Create Attendance**
```http
POST /api/v2/attendance
```

**Request Body:**
```json
{
  "staffId": "uuid",
  "date": "2023-11-16",
  "checkInTime": "09:00",
  "checkOutTime": "17:00",
  "isWeekend": false,
  "shiftId": "uuid"  // Optional - for shift-based attendance
}
```

#### 2. **Get Attendances**
```http
GET /api/v2/attendance?staffId={staffId}&startDate={date}&endDate={date}
```

#### 3. **Update Attendance**
```http
PUT /api/v2/attendance/{id}
```

#### 4. **Calculate Working Hours**
```http
GET /api/v2/attendance/{id}/calculate
```

**Response:**
```json
{
  "meta": {
    "success": true,
    "message": "Working hours calculated successfully"
  },
  "data": {
    "totalHours": 8.0,
    "effectiveHours": 8.0,
    "overtimeHours": 0.0,
    "lateMinutes": 0,
    "isFullDay": true,
    "calculationMode": "shift-based"  // or "legacy"
  }
}
```

### Check-in/Check-out Operations

#### 5. **Check In**
```http
POST /api/v2/attendance/checkin
```

**Request Body:**
```json
{
  "checkInTime": "09:00",
  "shiftId": "uuid"  // Optional - for shift-based check-in
}
```

#### 6. **Check Out**
```http
POST /api/v2/attendance/checkout
```

### Reporting and Summary

#### 7. **Attendance Summary**
```http
GET /api/v2/attendance/summary?staffId={staffId}&startDate={date}&endDate={date}
```

**Response:**
```json
{
  "data": {
    "totalAttendances": 20,
    "shiftBasedAttendances": 15,
    "legacyAttendances": 5,
    "totalWorkingHours": 160.0,
    "totalOvertimeHours": 10.0,
    "totalLateMinutes": 45,
    "fullDays": 18,
    "attendances": [
      {
        "attendance": { /* attendance object */ },
        "calculationMode": "shift-based",
        "workingHours": 8.0,
        "overtimeHours": 0.0,
        "lateMinutes": 0,
        "isFullDay": true
      }
    ]
  }
}
```

### Migration Helper Endpoints

#### 8. **Suggest Shift for Legacy Attendance**
```http
GET /api/v2/attendance/{id}/suggest-shift
```

**Response:**
```json
{
  "data": {
    "suggestedShift": {
      "id": "uuid",
      "name": "Morning Shift",
      "startTime": "09:00",
      "endTime": "17:00"
    },
    "reason": "Suggested based on check-in time 09:15 matching shift Morning Shift"
  }
}
```

#### 9. **Bulk Assign Shifts**
```http
POST /api/v2/attendance/bulk-assign-shifts
```

**Request Body:**
```json
{
  "assignments": [
    {
      "attendanceId": "uuid",
      "shiftId": "uuid"
    }
  ]
}
```

## Business Logic

### Attendance Domain Service

The `AttendanceDomainService` handles dual calculation modes:

```typescript
export class AttendanceDomainService {
  static calculateWorkingHours(
    attendance: Attendance, 
    shift?: Shift, 
    actualBreakMinutes?: number
  ): {
    totalHours: number;
    effectiveHours: number;
    overtimeHours: number;
    lateMinutes: number;
    isFullDay: boolean;
  } {
    // Legacy mode - no shift associated
    if (!attendance.hasShift() || !shift) {
      const totalHours = attendance.getEffectiveHours();
      const standardHours = 8; // Default 8 hours for legacy
      
      return {
        totalHours,
        effectiveHours: totalHours,
        overtimeHours: Math.max(0, totalHours - standardHours),
        lateMinutes: 0, // No late calculation for legacy
        isFullDay: totalHours >= standardHours
      };
    }

    // Shift-aware mode
    // ... shift-based calculations
  }
}
```

### Validation Rules

#### Legacy Attendance (No Shift)
- Only one attendance per staff per date
- No shift-specific validations
- Uses default 8-hour working day calculation

#### Shift-Based Attendance
- Can have multiple attendances per day (different shifts)
- Cannot have duplicate shift attendance on same date
- Validates check-in time within shift allowances
- Uses shift-specific parameters for calculations

### Migration Strategy

1. **Existing Data**: All current attendance records work as-is (legacy mode)
2. **Gradual Migration**: Use suggestion endpoints to identify suitable shifts
3. **Bulk Operations**: Use bulk assign endpoints for mass migration
4. **Dual Mode**: System supports both calculation methods simultaneously

## Error Handling

### Common Validation Errors
- `"Staff already has attendance for this shift on the same date"`
- `"Staff already has attendance for this date (legacy mode)"`
- `"Cannot check out without checking in first"`
- `"Check-in time must be within shift allowances"`

### Backward Compatibility Guarantees
- All existing API calls continue to work
- Legacy attendance records maintain their calculation methods
- Payroll systems receive consistent data structure
- No breaking changes to existing functionality

## Performance Considerations

### Database Indexing
```sql
-- Composite index for efficient queries
@@index([tenantId, staffId, date])

-- Individual indexes for filtering
@@index([shiftId])
@@index([date])
```

### Query Optimization
- Separate methods for shift-based vs legacy queries
- Efficient date range filtering
- Minimal database calls for calculations

## Testing Strategy

### Unit Tests
- Domain service calculation methods
- Validation rules for both modes
- Entity behavior verification

### Integration Tests
- API endpoint functionality
- Database operations
- Migration helper methods

### Backward Compatibility Tests
- Legacy attendance processing
- Payroll calculation consistency
- Migration scenarios

## Future Enhancements

1. **Analytics Dashboard**: Summary of shift vs legacy usage
2. **Automated Migration**: Smart shift assignment based on patterns
3. **Advanced Reporting**: Shift-based performance metrics
4. **Mobile App Integration**: QR code shift selection

## Deployment Notes

1. **Database Migration**: Applied automatically with optional shiftId field
2. **Zero Downtime**: Backward compatible changes only
3. **Monitoring**: Track usage of legacy vs shift-based calculations
4. **Rollback Plan**: System functions fully without shift data

This implementation ensures that the new shift management feature integrates seamlessly with existing attendance and payroll systems while providing a clear migration path for enhanced functionality.