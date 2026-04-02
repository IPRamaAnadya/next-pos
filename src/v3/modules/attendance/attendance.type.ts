// ─────────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────────

export interface AttendanceProfile {
  id: string;
  tenantId: string;
  staffId: string;
  shiftId: string | null;
  date: Date;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  isWeekend: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  staff?: { id: string; username: string; role: string } | null;
}

// ─────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────

export interface CheckInInput {
  staffId: string;
  date?: string;        // ISO date string (YYYY-MM-DD), defaults to today
  checkInTime: string;  // "HH:mm"
  shiftId?: string;
  isWeekend?: boolean;
}

export interface CheckOutInput {
  attendanceId: string;
  checkOutTime: string; // "HH:mm"
}

export interface UpdateAttendanceInput {
  checkInTime?: string;
  checkOutTime?: string;
  shiftId?: string | null;
  isWeekend?: boolean;
  totalHours?: number | null;
}

export interface AttendanceQueryInput {
  page?: number;
  pageSize?: number;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  isWeekend?: boolean;
}
