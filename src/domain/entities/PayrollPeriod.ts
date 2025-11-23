export class PayrollPeriod {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly isFinalized: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain Business Logic Methods
  
  public isActive(): boolean {
    const now = new Date();
    return now >= this.periodStart && now <= this.periodEnd;
  }

  public isPastPeriod(): boolean {
    const now = new Date();
    return now > this.periodEnd;
  }

  public isFuturePeriod(): boolean {
    const now = new Date();
    return now < this.periodStart;
  }

  public canBeFinalized(): boolean {
    return this.isPastPeriod() && !this.isFinalized;
  }

  public canBeModified(): boolean {
    return !this.isFinalized;
  }

  public getDurationInDays(): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = this.periodEnd.getTime() - this.periodStart.getTime();
    return Math.ceil(diffMs / msPerDay) + 1; // +1 to include both start and end days
  }

  public getWorkingDaysCount(excludeWeekends: boolean = true): number {
    const totalDays = this.getDurationInDays();
    if (!excludeWeekends) return totalDays;

    let workingDays = 0;
    const currentDate = new Date(this.periodStart);
    
    while (currentDate <= this.periodEnd) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  public includes(date: Date): boolean {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(this.periodStart.getFullYear(), this.periodStart.getMonth(), this.periodStart.getDate());
    const endOnly = new Date(this.periodEnd.getFullYear(), this.periodEnd.getMonth(), this.periodEnd.getDate());
    
    return dateOnly >= startOnly && dateOnly <= endOnly;
  }

  public static create(
    id: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    isFinalized: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): PayrollPeriod {
    // Business rule validations
    if (periodStart >= periodEnd) {
      throw new Error('Period start date must be before end date');
    }

    if (periodStart > new Date()) {
      // Allow future periods for planning
    }

    return new PayrollPeriod(
      id,
      tenantId,
      periodStart,
      periodEnd,
      isFinalized,
      createdAt,
      updatedAt
    );
  }

  public finalize(): PayrollPeriod {
    if (!this.canBeFinalized()) {
      throw new Error('Period cannot be finalized: either it is not past period or already finalized');
    }

    return new PayrollPeriod(
      this.id,
      this.tenantId,
      this.periodStart,
      this.periodEnd,
      true, // isFinalized = true
      this.createdAt,
      new Date() // updated updatedAt
    );
  }
}