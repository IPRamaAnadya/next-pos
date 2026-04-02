export class Shift {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly startTime: string, // Format: "HH:mm" (24-hour format)
    public readonly endTime: string, // Format: "HH:mm" (24-hour format)
    public readonly isActive: boolean,
    public readonly calculateBeforeStartTime: boolean,
    public readonly hasBreakTime: boolean,
    public readonly breakDuration: number, // in minutes
    public readonly minWorkingHours: number, // minimum hours to be considered full day
    public readonly maxWorkingHours: number, // maximum hours before overtime
    public readonly overtimeMultiplier: number, // overtime pay multiplier (e.g., 1.5)
    public readonly lateThreshold: number, // minutes after start time to be considered late
    public readonly earlyCheckInAllowed: number, // minutes before start time allowed
    public readonly color: string, // hex color for UI display
    public readonly description?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  // Business logic methods
  public isValid(): boolean {
    if (this.name.length === 0) {
      console.log('Invalid: name is empty');
      return false;
    }
    if (!this.isValidTimeFormat(this.startTime)) {
      console.log('Invalid: startTime format is incorrect');
      return false;
    }
    if (!this.isValidTimeFormat(this.endTime)) {
      console.log('Invalid: endTime format is incorrect');
      return false;
    }
    if (this.minWorkingHours <= 0) {
      console.log('Invalid: minWorkingHours must be greater than 0');
      return false;
    }
    if (this.maxWorkingHours < this.minWorkingHours) {
      console.log('Invalid: maxWorkingHours must be >= minWorkingHours');
      return false;
    }
    if (this.overtimeMultiplier <= 0) {
      console.log('Invalid: overtimeMultiplier must be greater than 0');
      return false;
    }
    if (this.lateThreshold < 0) {
      console.log('Invalid: lateThreshold must be >= 0');
      return false;
    }
    if (this.earlyCheckInAllowed < 0) {
      console.log('Invalid: earlyCheckInAllowed must be >= 0');
      return false;
    }
    if (this.breakDuration < 0) {
      console.log('Invalid: breakDuration must be >= 0');
      return false;
    }
    return true;
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  public getShiftDurationMinutes(): number {
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);
    
    // Handle overnight shifts
    if (end < start) {
      return (24 * 60) - start + end;
    }
    
    return end - start;
  }

  public getEffectiveWorkingMinutes(): number {
    const totalMinutes = this.getShiftDurationMinutes();
    return this.hasBreakTime ? totalMinutes - this.breakDuration : totalMinutes;
  }

  public getEffectiveWorkingHours(): number {
    return this.getEffectiveWorkingMinutes() / 60;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public isTimeInShift(checkTime: string): boolean {
    const checkMinutes = this.parseTime(checkTime);
    const startMinutes = this.parseTime(this.startTime);
    const endMinutes = this.parseTime(this.endTime);

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      return checkMinutes >= startMinutes || checkMinutes <= endMinutes;
    }

    return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
  }

  public calculateLateMinutes(checkInTime: string): number {
    const checkInMinutes = this.parseTime(checkInTime);
    const startMinutes = this.parseTime(this.startTime);
    
    // Allow early check-in
    const earliestAllowedMinutes = startMinutes - this.earlyCheckInAllowed;
    
    if (checkInMinutes <= startMinutes + this.lateThreshold) {
      return 0; // Not late
    }
    
    return checkInMinutes - startMinutes;
  }

  public calculateOvertimeHours(totalWorkedMinutes: number): number {
    const totalWorkedHours = totalWorkedMinutes / 60;
    const maxHours = this.maxWorkingHours;
    
    return totalWorkedHours > maxHours ? totalWorkedHours - maxHours : 0;
  }

  public isFullDayWork(totalWorkedMinutes: number): boolean {
    const totalWorkedHours = totalWorkedMinutes / 60;
    return totalWorkedHours >= this.minWorkingHours;
  }

  public static createNew(
    tenantId: string,
    name: string,
    startTime: string,
    endTime: string,
    options: Partial<{
      calculateBeforeStartTime: boolean;
      hasBreakTime: boolean;
      breakDuration: number;
      minWorkingHours: number;
      maxWorkingHours: number;
      overtimeMultiplier: number;
      lateThreshold: number;
      earlyCheckInAllowed: number;
      color: string;
      description: string;
    }> = {}
  ) {
    return {
      tenantId,
      name,
      startTime,
      endTime,
      isActive: true,
      calculateBeforeStartTime: options.calculateBeforeStartTime ?? true,
      hasBreakTime: options.hasBreakTime ?? false,
      breakDuration: options.breakDuration ?? 0,
      minWorkingHours: options.minWorkingHours ?? 8,
      maxWorkingHours: options.maxWorkingHours ?? 8,
      overtimeMultiplier: options.overtimeMultiplier ?? 1.5,
      lateThreshold: options.lateThreshold ?? 15, // 15 minutes
      earlyCheckInAllowed: options.earlyCheckInAllowed ?? 30, // 30 minutes
      color: options.color ?? '#3B82F6',
      description: options.description,
    };
  }
}