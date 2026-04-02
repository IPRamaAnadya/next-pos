export class PayrollSetting {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly ump: number | null,
    public readonly normalWorkHoursPerDay: number,
    public readonly normalWorkHoursPerMonth: number,
    public readonly overtimeRate1: number,
    public readonly overtimeRate2: number,
    public readonly overtimeRateWeekend1: number,
    public readonly overtimeRateWeekend2: number,
    public readonly overtimeRateWeekend3: number,
    public readonly overtimeCalculationType: 'HOURLY' | 'MONTHLY',
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain Business Logic Methods

  public calculateHourlyRate(basicSalary: number): number {
    if (basicSalary <= 0) {
      throw new Error('Basic salary must be greater than 0');
    }
    return Math.floor(basicSalary / this.normalWorkHoursPerMonth);
  }

  public calculateOvertimeRate(overtimeHours: number, isWeekend: boolean = false): number {
    if (overtimeHours <= 0) return 0;

    if (isWeekend) {
      // Weekend overtime rates
      if (overtimeHours <= 8) {
        return this.overtimeRateWeekend1;
      } else if (overtimeHours <= 9) {
        return this.overtimeRateWeekend2;
      } else {
        return this.overtimeRateWeekend3;
      }
    } else {
      // Regular overtime rates
      if (overtimeHours <= 1) {
        return this.overtimeRate1;
      } else {
        return this.overtimeRate2;
      }
    }
  }

  public isUMPCompliant(salary: number): boolean {
    if (!this.ump || this.ump <= 0) return true; // No UMP set
    return salary >= this.ump;
  }

  public getRecommendedMinimumSalary(): number {
    return this.ump || 0;
  }

  public validateOvertimeCalculationType(): boolean {
    return ['HOURLY', 'MONTHLY'].includes(this.overtimeCalculationType);
  }

  public getMaxRecommendedWorkHoursPerDay(): number {
    // Based on Indonesian labor law, max 8 hours regular + overtime
    return this.normalWorkHoursPerDay + 3; // max 3 hours overtime per day
  }

  public getMaxRecommendedWorkHoursPerWeek(): number {
    // Based on Indonesian labor law, max 40 hours regular + 14 hours overtime per week
    return (this.normalWorkHoursPerDay * 6) + 14; // 6 working days + max overtime
  }

  public static create(
    id: string,
    tenantId: string,
    ump: number | null = null,
    normalWorkHoursPerDay: number = 7,
    normalWorkHoursPerMonth: number = 173,
    overtimeRate1: number = 1.5,
    overtimeRate2: number = 2.0,
    overtimeRateWeekend1: number = 2.0,
    overtimeRateWeekend2: number = 3.0,
    overtimeRateWeekend3: number = 4.0,
    overtimeCalculationType: 'HOURLY' | 'MONTHLY' = 'HOURLY',
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): PayrollSetting {
    // Business rule validations
    if (normalWorkHoursPerDay <= 0 || normalWorkHoursPerDay > 24) {
      throw new Error('Normal work hours per day must be between 1 and 24');
    }

    if (normalWorkHoursPerMonth <= 0 || normalWorkHoursPerMonth > 744) { // 31 days * 24 hours
      throw new Error('Normal work hours per month must be between 1 and 744');
    }

    if (overtimeRate1 < 1 || overtimeRate2 < 1) {
      throw new Error('Overtime rates must be at least 1.0 (100% of regular rate)');
    }

    if (overtimeRate2 < overtimeRate1) {
      throw new Error('Overtime rate 2 must be greater than or equal to overtime rate 1');
    }

    if (ump && ump < 0) {
      throw new Error('UMP (minimum wage) cannot be negative');
    }

    return new PayrollSetting(
      id,
      tenantId,
      ump,
      normalWorkHoursPerDay,
      normalWorkHoursPerMonth,
      overtimeRate1,
      overtimeRate2,
      overtimeRateWeekend1,
      overtimeRateWeekend2,
      overtimeRateWeekend3,
      overtimeCalculationType,
      createdAt,
      updatedAt
    );
  }

  public updateRates(
    overtimeRate1?: number,
    overtimeRate2?: number,
    overtimeRateWeekend1?: number,
    overtimeRateWeekend2?: number,
    overtimeRateWeekend3?: number
  ): PayrollSetting {
    const newOvertimeRate1 = overtimeRate1 ?? this.overtimeRate1;
    const newOvertimeRate2 = overtimeRate2 ?? this.overtimeRate2;

    if (newOvertimeRate1 < 1 || newOvertimeRate2 < 1) {
      throw new Error('Overtime rates must be at least 1.0 (100% of regular rate)');
    }

    if (newOvertimeRate2 < newOvertimeRate1) {
      throw new Error('Overtime rate 2 must be greater than or equal to overtime rate 1');
    }

    return new PayrollSetting(
      this.id,
      this.tenantId,
      this.ump,
      this.normalWorkHoursPerDay,
      this.normalWorkHoursPerMonth,
      newOvertimeRate1,
      newOvertimeRate2,
      overtimeRateWeekend1 ?? this.overtimeRateWeekend1,
      overtimeRateWeekend2 ?? this.overtimeRateWeekend2,
      overtimeRateWeekend3 ?? this.overtimeRateWeekend3,
      this.overtimeCalculationType,
      this.createdAt,
      new Date()
    );
  }
}