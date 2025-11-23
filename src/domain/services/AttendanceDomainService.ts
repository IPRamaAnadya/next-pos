import { Attendance } from '../entities/Attendance';
import { Shift } from '../entities/Shift';

export class AttendanceDomainService {
  /**
   * Calculate working hours with backward compatibility
   * - If attendance has no shift, use legacy calculation
   * - If attendance has shift, use shift-aware calculation
   */
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
    const breakDuration = actualBreakMinutes ?? (shift.hasBreakTime ? shift.breakDuration : 0);
    const totalHours = attendance.calculateShiftAwareHours(shift, breakDuration);
    const effectiveHours = totalHours;

    // Calculate late minutes if check-in time exists
    let lateMinutes = 0;
    if (attendance.checkInTime) {
      lateMinutes = shift.calculateLateMinutes(attendance.checkInTime);
    }

    // Calculate overtime based on shift rules
    const totalWorkedMinutes = totalHours * 60;
    const overtimeHours = shift.calculateOvertimeHours(totalWorkedMinutes);

    // Check if it's a full day based on shift rules
    const isFullDay = shift.isFullDayWork(totalWorkedMinutes);

    return {
      totalHours,
      effectiveHours,
      overtimeHours,
      lateMinutes,
      isFullDay
    };
  }

  /**
   * Validate attendance constraints
   */
  static validateAttendance(
    attendance: Attendance, 
    existingAttendances: Attendance[] = [],
    shift?: Shift
  ): void {
    // Basic validation
    if (!attendance.isValid()) {
      throw new Error('Invalid attendance data');
    }

    // If shift is provided, ensure no duplicate shift attendance on same date
    if (attendance.hasShift() && shift) {
      const sameShiftSameDate = existingAttendances.find(existing => 
        existing.staffId === attendance.staffId &&
        existing.date.toDateString() === attendance.date.toDateString() &&
        existing.shiftId === attendance.shiftId &&
        existing.id !== attendance.id
      );

      if (sameShiftSameDate) {
        throw new Error('Staff already has attendance for this shift on the same date');
      }
    }

    // For legacy attendances (no shift), ensure only one attendance per staff per date
    if (!attendance.hasShift()) {
      const sameDateAttendance = existingAttendances.find(existing => 
        existing.staffId === attendance.staffId &&
        existing.date.toDateString() === attendance.date.toDateString() &&
        !existing.hasShift() &&
        existing.id !== attendance.id
      );

      if (sameDateAttendance) {
        throw new Error('Staff already has attendance for this date (legacy mode)');
      }
    }

    // Validate check-in/check-out logic
    if (attendance.checkOutTime && !attendance.checkInTime) {
      throw new Error('Cannot check out without checking in first');
    }

    // If shift is provided, validate times are within reasonable range
    if (attendance.checkInTime && shift) {
      // Allow check-in within early check-in allowance and reasonable late threshold
      const checkInMinutes = this.parseTime(attendance.checkInTime);
      const shiftStartMinutes = this.parseTime(shift.startTime);
      const earlyLimit = shiftStartMinutes - shift.earlyCheckInAllowed;
      const lateLimit = shiftStartMinutes + (4 * 60); // 4 hours after shift start

      if (checkInMinutes < earlyLimit || checkInMinutes > lateLimit) {
        throw new Error(`Check-in time must be within ${shift.earlyCheckInAllowed} minutes before and 4 hours after shift start time`);
      }
    }
  }

  /**
   * Determine if attendance should use shift-based or legacy calculation
   */
  static shouldUseShiftCalculation(attendance: Attendance, shift?: Shift): boolean {
    return attendance.hasShift() && !!shift;
  }

  /**
   * Get attendance calculation mode for reporting
   */
  static getCalculationMode(attendance: Attendance): 'shift-based' | 'legacy' {
    return attendance.hasShift() ? 'shift-based' : 'legacy';
  }

  /**
   * Create attendance with proper shift linking
   */
  static createAttendanceWithShift(
    tenantId: string,
    staffId: string,
    date: Date,
    shiftId?: string,
    checkInTime?: string,
    checkOutTime?: string,
    isWeekend: boolean = false
  ) {
    return Attendance.createNew(
      tenantId,
      staffId,
      date,
      checkInTime,
      checkOutTime,
      isWeekend,
      shiftId
    );
  }

  /**
   * Migrate legacy attendance to shift-based (if needed)
   */
  static suggestShiftForLegacyAttendance(
    attendance: Attendance,
    availableShifts: Shift[]
  ): Shift | null {
    if (attendance.hasShift() || !attendance.checkInTime) {
      return null;
    }

    // Find the most suitable shift based on check-in time
    const checkInTime = attendance.checkInTime;
    
    for (const shift of availableShifts) {
      if (shift.isTimeInShift(checkInTime)) {
        return shift;
      }
    }

    return null;
  }

  private static parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}