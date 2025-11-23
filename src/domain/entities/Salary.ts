export type SalaryType = 'MONTHLY' | 'DAILY' | 'HOURLY';

export class Salary {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly staffId: string,
    public readonly basicSalary: number,
    public readonly fixedAllowance: number,
    public readonly type: SalaryType,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Enhanced Domain Business Logic Methods

  public isValid(): boolean {
    return this.basicSalary > 0 && this.fixedAllowance >= 0;
  }

  public getTotalSalary(): number {
    return this.basicSalary + this.fixedAllowance;
  }

  public getTotalBaseSalary(): number {
    return this.basicSalary + this.fixedAllowance;
  }

  public getHourlyRate(workHoursPerMonth: number = 173): number {
    if (this.type === 'HOURLY') {
      return this.basicSalary;
    }
    
    if (workHoursPerMonth <= 0) {
      throw new Error('Work hours per month must be greater than 0');
    }
    
    return this.basicSalary / workHoursPerMonth;
  }

  public calculateDailySalary(workDaysPerMonth: number = 25): number {
    if (this.type === 'DAILY') return this.basicSalary;
    
    if (workDaysPerMonth <= 0) {
      throw new Error('Work days per month must be greater than 0');
    }
    
    return this.basicSalary / workDaysPerMonth;
  }

  public calculateHourlySalary(workHoursPerMonth: number = 173): number {
    return this.getHourlyRate(workHoursPerMonth);
  }

  public isAboveMinimumWage(minimumWage: number): boolean {
    if (minimumWage <= 0) return true; // No minimum wage requirement
    return this.basicSalary >= minimumWage;
  }

  public getEffectiveSalaryForPeriod(periodDays: number, totalWorkDays: number = 25): number {
    if (this.type === 'MONTHLY') {
      // For monthly salary, calculate proportional amount based on period
      const dailyRate = this.calculateDailySalary(totalWorkDays);
      return dailyRate * periodDays;
    } else if (this.type === 'DAILY') {
      return this.basicSalary * periodDays;
    } else {
      // HOURLY - needs work hours calculation
      throw new Error('Hourly salary calculation requires work hours information');
    }
  }

  public static create(
    id: string,
    tenantId: string,
    staffId: string,
    basicSalary: number,
    fixedAllowance: number = 0,
    type: SalaryType = 'MONTHLY',
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): Salary {
    // Business rule validations
    if (basicSalary <= 0) {
      throw new Error('Basic salary must be greater than 0');
    }

    if (fixedAllowance < 0) {
      throw new Error('Fixed allowance cannot be negative');
    }

    if (!['MONTHLY', 'DAILY', 'HOURLY'].includes(type)) {
      throw new Error('Invalid salary type. Must be MONTHLY, DAILY, or HOURLY');
    }

    return new Salary(
      id,
      tenantId,
      staffId,
      basicSalary,
      fixedAllowance,
      type,
      createdAt,
      updatedAt
    );
  }

  public static createNew(
    tenantId: string,
    staffId: string,
    basicSalary: number,
    fixedAllowance: number = 0,
    type: SalaryType = 'MONTHLY'
  ): { tenantId: string; staffId: string; basicSalary: number; fixedAllowance: number; type: SalaryType } {
    // Business rule validations
    if (basicSalary <= 0) {
      throw new Error('Basic salary must be greater than 0');
    }

    if (fixedAllowance < 0) {
      throw new Error('Fixed allowance cannot be negative');
    }

    return {
      tenantId,
      staffId,
      basicSalary,
      fixedAllowance,
      type,
    };
  }

  public updateAmount(basicSalary?: number, fixedAllowance?: number): Salary {
    const newBasicSalary = basicSalary ?? this.basicSalary;
    const newFixedAllowance = fixedAllowance ?? this.fixedAllowance;

    if (newBasicSalary <= 0) {
      throw new Error('Basic salary must be greater than 0');
    }

    if (newFixedAllowance < 0) {
      throw new Error('Fixed allowance cannot be negative');
    }

    return new Salary(
      this.id,
      this.tenantId,
      this.staffId,
      newBasicSalary,
      newFixedAllowance,
      this.type,
      this.createdAt,
      new Date()
    );
  }

  public changeType(newType: SalaryType): Salary {
    if (!['MONTHLY', 'DAILY', 'HOURLY'].includes(newType)) {
      throw new Error('Invalid salary type. Must be MONTHLY, DAILY, or HOURLY');
    }

    return new Salary(
      this.id,
      this.tenantId,
      this.staffId,
      this.basicSalary,
      this.fixedAllowance,
      newType,
      this.createdAt,
      new Date()
    );
  }
}