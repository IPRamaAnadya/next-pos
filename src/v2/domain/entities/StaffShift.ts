import { Shift } from "./Shift";
import { Staff } from "./Staff";

export class StaffShift {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly staffId: string,
    public readonly shiftId: string,
    public readonly date: Date,
    public readonly checkInTime?: string, // Format: "HH:mm"
    public readonly checkOutTime?: string, // Format: "HH:mm"
    public readonly actualBreakDuration?: number, // in minutes
    public readonly totalWorkedMinutes?: number,
    public readonly lateMinutes?: number,
    public readonly overtimeMinutes?: number,
    public readonly isCompleted?: boolean,
    public readonly notes?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly shift?: Shift,
    public readonly staff?: Staff,
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return (
      this.tenantId.length > 0 &&
      this.staffId.length > 0 &&
      this.shiftId.length > 0 &&
      this.date instanceof Date
    );
  }

  public hasCheckedIn(): boolean {
    return !!this.checkInTime;
  }

  public hasCheckedOut(): boolean {
    return !!this.checkOutTime;
  }

  public isActive(): boolean {
    return this.hasCheckedIn() && !this.hasCheckedOut();
  }

  public calculateWorkedMinutes(): number {
    if (!this.checkInTime || !this.checkOutTime) {
      return 0;
    }

    const checkIn = this.parseTime(this.checkInTime);
    const checkOut = this.parseTime(this.checkOutTime);
    
    // Handle overnight work
    if (checkOut < checkIn) {
      return (24 * 60) - checkIn + checkOut;
    }
    
    return checkOut - checkIn;
  }

  public calculateEffectiveWorkedMinutes(breakDuration: number = 0): number {
    const totalMinutes = this.calculateWorkedMinutes();
    const actualBreak = this.actualBreakDuration ?? breakDuration;
    return Math.max(0, totalMinutes - actualBreak);
  }

  public calculateWorkedHours(): number {
    return this.calculateWorkedMinutes() / 60;
  }

  public calculateEffectiveWorkedHours(breakDuration: number = 0): number {
    return this.calculateEffectiveWorkedMinutes(breakDuration) / 60;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  public canCheckOut(): boolean {
    return this.hasCheckedIn() && !this.hasCheckedOut();
  }

  public canCheckIn(): boolean {
    return !this.hasCheckedIn();
  }

  public checkIn(time: string): StaffShift {
    if (!this.canCheckIn()) {
      throw new Error('Cannot check in: already checked in or invalid state');
    }

    return new StaffShift(
      this.id,
      this.tenantId,
      this.staffId,
      this.shiftId,
      this.date,
      time,
      this.checkOutTime,
      this.actualBreakDuration,
      this.totalWorkedMinutes,
      this.lateMinutes,
      this.overtimeMinutes,
      false,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  public checkOut(time: string, actualBreakDuration?: number): StaffShift {
    if (!this.canCheckOut()) {
      throw new Error('Cannot check out: not checked in or already checked out');
    }

    const newStaffShift = new StaffShift(
      this.id,
      this.tenantId,
      this.staffId,
      this.shiftId,
      this.date,
      this.checkInTime,
      time,
      actualBreakDuration ?? this.actualBreakDuration,
      undefined,
      this.lateMinutes,
      this.overtimeMinutes,
      true,
      this.notes,
      this.createdAt,
      new Date()
    );

    // Calculate worked minutes after setting check out time
    const workedMinutes = newStaffShift.calculateWorkedMinutes();
    
    return new StaffShift(
      newStaffShift.id,
      newStaffShift.tenantId,
      newStaffShift.staffId,
      newStaffShift.shiftId,
      newStaffShift.date,
      newStaffShift.checkInTime,
      newStaffShift.checkOutTime,
      newStaffShift.actualBreakDuration,
      workedMinutes,
      newStaffShift.lateMinutes,
      newStaffShift.overtimeMinutes,
      newStaffShift.isCompleted,
      newStaffShift.notes,
      newStaffShift.createdAt,
      newStaffShift.updatedAt
    );
  }

  public updateLateMinutes(minutes: number): StaffShift {
    return new StaffShift(
      this.id,
      this.tenantId,
      this.staffId,
      this.shiftId,
      this.date,
      this.checkInTime,
      this.checkOutTime,
      this.actualBreakDuration,
      this.totalWorkedMinutes,
      minutes,
      this.overtimeMinutes,
      this.isCompleted,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  public updateOvertimeMinutes(minutes: number): StaffShift {
    return new StaffShift(
      this.id,
      this.tenantId,
      this.staffId,
      this.shiftId,
      this.date,
      this.checkInTime,
      this.checkOutTime,
      this.actualBreakDuration,
      this.totalWorkedMinutes,
      this.lateMinutes,
      minutes,
      this.isCompleted,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  public static createNew(
    tenantId: string,
    staffId: string,
    shiftId: string,
    date: Date,
    options: Partial<{
      notes: string;
    }> = {}
  ) {
    return {
      tenantId,
      staffId,
      shiftId,
      date,
      checkInTime: undefined,
      checkOutTime: undefined,
      actualBreakDuration: undefined,
      totalWorkedMinutes: undefined,
      lateMinutes: 0,
      overtimeMinutes: 0,
      isCompleted: false,
      notes: options.notes,
    };
  }
}