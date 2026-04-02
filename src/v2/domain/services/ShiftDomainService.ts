import { Shift } from '../entities/Shift';
import { StaffShift } from '../entities/StaffShift';

export class ShiftDomainService {
  /**
   * Validate business rules for shift creation/update
   */
  static validateShift(shift: Shift): void {
    if (!shift.isValid()) {
      throw new Error('Invalid shift data provided');
    }

    // Business rule: Shift duration should be reasonable (between 1-24 hours)
    const durationMinutes = shift.getShiftDurationMinutes();
    if (durationMinutes < 60 || durationMinutes > 24 * 60) {
      throw new Error('Shift duration must be between 1 and 24 hours');
    }

    // Business rule: Break duration should not exceed shift duration
    if (shift.hasBreakTime && shift.breakDuration >= durationMinutes) {
      throw new Error('Break duration cannot exceed shift duration');
    }

    // Business rule: Minimum working hours should be achievable
    const effectiveHours = shift.getEffectiveWorkingHours();
    if (shift.minWorkingHours > effectiveHours) {
      throw new Error('Minimum working hours cannot exceed effective working hours');
    }
  }

  /**
   * Check if two shifts have overlapping times
   */
  static hasTimeOverlap(shift1: Shift, shift2: Shift): boolean {
    const shift1Start = this.parseTime(shift1.startTime);
    const shift1End = this.parseTime(shift1.endTime);
    const shift2Start = this.parseTime(shift2.startTime);
    const shift2End = this.parseTime(shift2.endTime);

    // Handle overnight shifts
    const shift1IsOvernight = shift1End < shift1Start;
    const shift2IsOvernight = shift2End < shift2Start;

    if (shift1IsOvernight && shift2IsOvernight) {
      // Both are overnight shifts - they overlap
      return true;
    }

    if (shift1IsOvernight) {
      // shift1 is overnight, check if shift2 overlaps with either part
      return (shift2Start >= shift1Start || shift2End <= shift1End);
    }

    if (shift2IsOvernight) {
      // shift2 is overnight, check if shift1 overlaps with either part
      return (shift1Start >= shift2Start || shift1End <= shift2End);
    }

    // Both are regular shifts
    return !(shift1End <= shift2Start || shift2End <= shift1Start);
  }

  /**
   * Calculate late minutes for check-in time
   */
  static calculateLateMinutes(shift: Shift, checkInTime: string): number {
    return shift.calculateLateMinutes(checkInTime);
  }

  /**
   * Calculate overtime for worked time
   */
  static calculateOvertimeMinutes(shift: Shift, totalWorkedMinutes: number): number {
    const overtimeHours = shift.calculateOvertimeHours(totalWorkedMinutes);
    return Math.round(overtimeHours * 60);
  }

  /**
   * Validate staff shift assignment
   */
  static validateStaffShift(staffShift: StaffShift, shift: Shift): void {
    if (!staffShift.isValid()) {
      throw new Error('Invalid staff shift data');
    }

    // Business rule: Cannot assign shifts for past dates (except today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(staffShift.date);
    shiftDate.setHours(0, 0, 0, 0);

    if (shiftDate < today) {
      throw new Error('Cannot assign shifts for past dates');
    }

    // Business rule: Check-in time should be within reasonable range of shift start time
    if (staffShift.checkInTime && shift.calculateBeforeStartTime) {
      const checkInMinutes = this.parseTime(staffShift.checkInTime);
      const shiftStartMinutes = this.parseTime(shift.startTime);
      const earlyLimit = shiftStartMinutes - shift.earlyCheckInAllowed;
      const lateLimit = shiftStartMinutes + (4 * 60); // 4 hours after shift start

      if (checkInMinutes < earlyLimit || checkInMinutes > lateLimit) {
        throw new Error(`Check-in time must be within ${shift.earlyCheckInAllowed} minutes before and 4 hours after shift start time`);
      }
    }
  }

  /**
   * Check for overlapping staff shifts on the same date
   */
  static hasStaffShiftOverlap(existingShifts: StaffShift[], newStaffShift: StaffShift, shifts: Shift[]): boolean {
    const newShift = shifts.find(s => s.id === newStaffShift.shiftId);
    if (!newShift) return false;

    const sameDateShifts = existingShifts.filter(ss => {
      const existingDate = new Date(ss.date);
      const newDate = new Date(newStaffShift.date);
      return existingDate.toDateString() === newDate.toDateString() && ss.id !== newStaffShift.id;
    });

    for (const existingStaffShift of sameDateShifts) {
      const existingShift = shifts.find(s => s.id === existingStaffShift.shiftId);
      if (existingShift && this.hasTimeOverlap(existingShift, newShift)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate total worked time considering break time
   */
  static calculateWorkTime(staffShift: StaffShift, shift: Shift): {
    totalMinutes: number;
    effectiveMinutes: number;
    lateMinutes: number;
    overtimeMinutes: number;
  } {
    if (!staffShift.checkInTime || !staffShift.checkOutTime) {
      return {
        totalMinutes: 0,
        effectiveMinutes: 0,
        lateMinutes: 0,
        overtimeMinutes: 0
      };
    }

    const totalMinutes = staffShift.calculateWorkedMinutes();
    const breakDuration = staffShift.actualBreakDuration ?? (shift.hasBreakTime ? shift.breakDuration : 0);
    const effectiveMinutes = Math.max(0, totalMinutes - breakDuration);

    const lateMinutes = this.calculateLateMinutes(shift, staffShift.checkInTime);
    const overtimeMinutes = this.calculateOvertimeMinutes(shift, effectiveMinutes);

    return {
      totalMinutes,
      effectiveMinutes,
      lateMinutes,
      overtimeMinutes
    };
  }

  /**
   * Generate default shift templates
   */
  static createDefaultShifts(tenantId: string) {
    return [
      Shift.createNew(tenantId, 'Morning Shift', '08:00', '16:00', {
        hasBreakTime: true,
        breakDuration: 60,
        minWorkingHours: 7,
        maxWorkingHours: 8,
        color: '#F59E0B',
        description: 'Standard morning shift with 1-hour break'
      }),
      Shift.createNew(tenantId, 'Evening Shift', '16:00', '00:00', {
        hasBreakTime: true,
        breakDuration: 60,
        minWorkingHours: 7,
        maxWorkingHours: 8,
        color: '#8B5CF6',
        description: 'Evening shift with 1-hour break'
      }),
      Shift.createNew(tenantId, 'Night Shift', '00:00', '08:00', {
        hasBreakTime: true,
        breakDuration: 60,
        minWorkingHours: 7,
        maxWorkingHours: 8,
        overtimeMultiplier: 2.0,
        color: '#1F2937',
        description: 'Night shift with higher overtime rate'
      }),
      Shift.createNew(tenantId, 'Full Day', '08:00', '17:00', {
        hasBreakTime: true,
        breakDuration: 60,
        minWorkingHours: 8,
        maxWorkingHours: 9,
        color: '#10B981',
        description: 'Full day shift with lunch break'
      })
    ];
  }

  private static parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}