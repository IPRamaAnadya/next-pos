export interface CreateAttendanceData {
  tenantId: string;
  staffId: string;
  date: Date;
  checkInTime?: string;
  checkOutTime?: string;
  isWeekend?: boolean;
  shiftId?: string; // Optional for backward compatibility
}

export interface UpdateAttendanceData {
  date?: Date;
  checkInTime?: string;
  checkOutTime?: string;
  isWeekend?: boolean;
  shiftId?: string; // Optional for backward compatibility
}

export interface AttendanceResponse {
  id: string;
  tenantId: string;
  staffId: string;
  date: string; // ISO date string
  checkInTime?: string;
  checkOutTime?: string;
  isWeekend: boolean;
  shiftId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCalculationResponse {
  totalHours: number;
  effectiveHours: number;
  overtimeHours: number;
  lateMinutes: number;
  isFullDay: boolean;
  calculationMode: 'shift-based' | 'legacy';
}

export interface AttendanceSummaryResponse {
  totalAttendances: number;
  shiftBasedAttendances: number;
  legacyAttendances: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  fullDays: number;
  attendances: Array<{
    attendance: AttendanceResponse;
    calculationMode: 'shift-based' | 'legacy';
    workingHours: number;
    overtimeHours: number;
    lateMinutes: number;
    isFullDay: boolean;
  }>;
}

export interface CheckInRequest {
  checkInTime: string; // Format: "HH:mm"
  shiftId?: string; // Optional for backward compatibility
}

export interface CheckOutRequest {
  checkOutTime: string; // Format: "HH:mm"
  shiftId?: string; // Optional for backward compatibility
}

export interface ShiftSuggestionResponse {
  suggestedShift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  reason: string;
}

export interface BulkShiftAssignmentRequest {
  assignments: Array<{
    attendanceId: string;
    shiftId: string;
  }>;
}

export interface BulkShiftAssignmentResponse {
  successful: number;
  failed: Array<{
    attendanceId: string;
    error: string;
  }>;
}