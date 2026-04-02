export class PayrollDetail {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly payrollPeriodId: string,
    public readonly staffId: string,
    public readonly basicSalaryAmount: number,
    public readonly fixedAllowanceAmount: number,
    public readonly overtimeHours: number,
    public readonly overtimePay: number,
    public readonly bonusAmount: number,
    public readonly deductionsAmount: number,
    public readonly takeHomePay: number,
    public readonly isPaid: boolean,
    public readonly paidAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Enhanced Domain Business Logic Methods

  public isValid(): boolean {
    return this.basicSalaryAmount >= 0 && 
           this.fixedAllowanceAmount >= 0 && 
           this.takeHomePay >= 0 &&
           this.overtimeHours >= 0 &&
           this.overtimePay >= 0 &&
           this.bonusAmount >= 0 &&
           this.deductionsAmount >= 0;
  }

  public getGrossPay(): number {
    return this.basicSalaryAmount + this.fixedAllowanceAmount + this.overtimePay + this.bonusAmount;
  }

  public getBasePay(): number {
    return this.basicSalaryAmount + this.fixedAllowanceAmount;
  }

  public getTotalDeductions(): number {
    return this.deductionsAmount;
  }

  public getTotalBenefits(): number {
    return this.overtimePay + this.bonusAmount;
  }

  public calculateTakeHomePay(): number {
    return Math.max(0, this.getGrossPay() - this.getTotalDeductions());
  }

  public validateCalculation(): boolean {
    const calculatedTakeHome = this.calculateTakeHomePay();
    return Math.abs(calculatedTakeHome - this.takeHomePay) < 0.01; // Allow small floating point differences
  }

  public canBePaid(): boolean {
    return !this.isPaid && this.takeHomePay > 0 && this.isValid();
  }

  public canBeModified(): boolean {
    return !this.isPaid;
  }

  public hasOvertime(): boolean {
    return this.overtimeHours > 0;
  }

  public hasBonus(): boolean {
    return this.bonusAmount > 0;
  }

  public hasDeductions(): boolean {
    return this.deductionsAmount > 0;
  }

  public getOvertimeRate(): number {
    if (this.overtimeHours <= 0) return 0;
    return this.overtimePay / this.overtimeHours;
  }

  public getDaysOverdue(): number {
    if (this.isPaid || !this.paidAt) return 0;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((now.getTime() - this.paidAt.getTime()) / msPerDay);
  }

  public markAsPaid(): { isPaid: boolean; paidAt: Date } {
    if (!this.canBePaid()) {
      throw new Error('Payroll detail cannot be marked as paid');
    }
    
    return {
      isPaid: true,
      paidAt: new Date(),
    };
  }

  public addBonus(amount: number, reason?: string): PayrollDetail {
    if (amount < 0) {
      throw new Error('Bonus amount cannot be negative');
    }

    if (!this.canBeModified()) {
      throw new Error('Cannot modify paid payroll detail');
    }

    const newBonusAmount = this.bonusAmount + amount;
    const newTakeHomePay = this.getBasePay() + this.overtimePay + newBonusAmount - this.deductionsAmount;

    return new PayrollDetail(
      this.id,
      this.tenantId,
      this.payrollPeriodId,
      this.staffId,
      this.basicSalaryAmount,
      this.fixedAllowanceAmount,
      this.overtimeHours,
      this.overtimePay,
      newBonusAmount,
      this.deductionsAmount,
      newTakeHomePay,
      this.isPaid,
      this.paidAt,
      this.createdAt,
      new Date()
    );
  }

  public addDeduction(amount: number, reason?: string): PayrollDetail {
    if (amount < 0) {
      throw new Error('Deduction amount cannot be negative');
    }

    if (!this.canBeModified()) {
      throw new Error('Cannot modify paid payroll detail');
    }

    const newDeductionsAmount = this.deductionsAmount + amount;
    const newTakeHomePay = Math.max(0, this.getBasePay() + this.overtimePay + this.bonusAmount - newDeductionsAmount);

    return new PayrollDetail(
      this.id,
      this.tenantId,
      this.payrollPeriodId,
      this.staffId,
      this.basicSalaryAmount,
      this.fixedAllowanceAmount,
      this.overtimeHours,
      this.overtimePay,
      this.bonusAmount,
      newDeductionsAmount,
      newTakeHomePay,
      this.isPaid,
      this.paidAt,
      this.createdAt,
      new Date()
    );
  }

  public static create(
    id: string,
    tenantId: string,
    payrollPeriodId: string,
    staffId: string,
    basicSalaryAmount: number,
    fixedAllowanceAmount: number = 0,
    overtimeHours: number = 0,
    overtimePay: number = 0,
    bonusAmount: number = 0,
    deductionsAmount: number = 0,
    isPaid: boolean = false,
    paidAt: Date | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): PayrollDetail {
    // Business rule validations
    if (basicSalaryAmount < 0) {
      throw new Error('Basic salary amount cannot be negative');
    }
    
    if (fixedAllowanceAmount < 0) {
      throw new Error('Fixed allowance amount cannot be negative');
    }
    
    if (overtimeHours < 0) {
      throw new Error('Overtime hours cannot be negative');
    }
    
    if (overtimePay < 0) {
      throw new Error('Overtime pay cannot be negative');
    }
    
    if (bonusAmount < 0) {
      throw new Error('Bonus amount cannot be negative');
    }
    
    if (deductionsAmount < 0) {
      throw new Error('Deductions amount cannot be negative');
    }

    const takeHomePay = Math.max(0, basicSalaryAmount + fixedAllowanceAmount + overtimePay + bonusAmount - deductionsAmount);

    return new PayrollDetail(
      id,
      tenantId,
      payrollPeriodId,
      staffId,
      basicSalaryAmount,
      fixedAllowanceAmount,
      overtimeHours,
      overtimePay,
      bonusAmount,
      deductionsAmount,
      takeHomePay,
      isPaid,
      paidAt,
      createdAt,
      updatedAt
    );
  }

  public static createNew(
    tenantId: string,
    payrollPeriodId: string,
    staffId: string,
    basicSalaryAmount: number,
    fixedAllowanceAmount: number = 0,
    overtimeHours: number = 0,
    overtimePay: number = 0,
    bonusAmount: number = 0,
    deductionsAmount: number = 0
  ): {
    tenantId: string;
    payrollPeriodId: string;
    staffId: string;
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
  } {
    const grossPay = basicSalaryAmount + fixedAllowanceAmount + overtimePay + bonusAmount;
    const takeHomePay = grossPay - deductionsAmount;
    
    return {
      tenantId,
      payrollPeriodId,
      staffId,
      basicSalaryAmount,
      fixedAllowanceAmount,
      overtimeHours,
      overtimePay,
      bonusAmount,
      deductionsAmount,
      takeHomePay,
    };
  }
}