export class Attendance {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly staffId: string,
    public readonly date: Date,
    public readonly checkInTime: string | null,
    public readonly checkOutTime: string | null,
    public readonly totalHours: number | null,
    public readonly isWeekend: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly shiftId?: string | null
  ) {}

  public isValid(): boolean {
    return this.date instanceof Date && this.staffId.length > 0;
  }

  public hasCheckedIn(): boolean {
    return this.checkInTime !== null;
  }

  public hasCheckedOut(): boolean {
    return this.checkOutTime !== null;
  }

  public isComplete(): boolean {
    return this.hasCheckedIn() && this.hasCheckedOut();
  }

  public calculateHours(): number {
    if (!this.checkInTime || !this.checkOutTime) {
      return 0;
    }

    const checkIn = this.parseTime(this.checkInTime);
    const checkOut = this.parseTime(this.checkOutTime);

    // Handle overnight shifts
    let diffMinutes = checkOut - checkIn;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours in minutes
    }

    return diffMinutes / 60; // Convert to hours
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public isOvertime(normalHours: number = 8): boolean {
    const actualHours = this.totalHours || this.calculateHours();
    return actualHours > normalHours;
  }

  public getOvertimeHours(normalHours: number = 8): number {
    const actualHours = this.totalHours || this.calculateHours();
    return Math.max(0, actualHours - normalHours);
  }

  // Check if this attendance is linked to a shift
  public hasShift(): boolean {
    return !!this.shiftId;
  }

  // Legacy calculation method - maintains backward compatibility
  public calculateLegacyHours(): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${this.checkInTime}`);
    const checkOut = new Date(`1970-01-01T${this.checkOutTime}`);
    
    let diffMs = checkOut.getTime() - checkIn.getTime();
    
    // Handle overnight shifts (when check out is next day)
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
  }

  // Shift-aware calculation method
  public calculateShiftAwareHours(shift?: any, breakDurationMinutes: number = 0): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    
    const totalMinutes = this.calculateWorkedMinutes();
    const effectiveMinutes = Math.max(0, totalMinutes - breakDurationMinutes);
    
    return effectiveMinutes / 60;
  }

  // Helper method to calculate worked minutes
  private calculateWorkedMinutes(): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const checkInMinutes = parseTime(this.checkInTime);
    const checkOutMinutes = parseTime(this.checkOutTime);
    
    // Handle overnight work
    if (checkOutMinutes < checkInMinutes) {
      return (24 * 60) - checkInMinutes + checkOutMinutes;
    }
    
    return checkOutMinutes - checkInMinutes;
  }

  // Get the appropriate hours calculation based on whether shift is present
  public getEffectiveHours(shift?: any, breakDurationMinutes: number = 0): number {
    if (this.hasShift() && shift) {
      return this.calculateShiftAwareHours(shift, breakDurationMinutes);
    }
    
    // Use legacy calculation for backward compatibility
    return this.totalHours || this.calculateLegacyHours();
  }

  public static createNew(
    tenantId: string,
    staffId: string,
    date: Date,
    checkInTime?: string,
    checkOutTime?: string,
    isWeekend: boolean = false,
    shiftId?: string
  ): { tenantId: string; staffId: string; date: Date; checkInTime?: string; checkOutTime?: string; isWeekend: boolean; shiftId?: string } {
    return {
      tenantId,
      staffId,
      date,
      checkInTime,
      checkOutTime,
      isWeekend,
      ...(shiftId && { shiftId }),
    };
  }
}