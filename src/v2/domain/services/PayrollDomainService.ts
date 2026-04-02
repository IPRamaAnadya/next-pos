import { PayrollDetail } from '../entities/PayrollDetail';
import { PayrollPeriod } from '../entities/PayrollPeriod';
import { PayrollSetting } from '../entities/PayrollSetting';
import { Salary } from '../entities/Salary';
import { Attendance } from '../entities/Attendance';

export interface PayrollCalculationParams {
  salary: Salary;
  payrollSetting: PayrollSetting;
  attendances: Attendance[];
  bonusAmount?: number;
  deductionsAmount?: number;
  manualOvertimeHours?: number;
  useActualWorkHours?: boolean;
}

export interface PayrollCalculationResult {
  basicSalaryAmount: number;
  fixedAllowanceAmount: number;
  totalWorkHours: number;
  normalWorkHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimePay: number;
  bonusAmount: number;
  deductionsAmount: number;
  grossPay: number;
  takeHomePay: number;
  calculationMode: 'ATTENDANCE_BASED' | 'MANUAL' | 'HYBRID';
}

export class PayrollDomainService {
  
  /**
   * Calculate complete payroll for a staff member based on attendance and settings
   */
  static calculatePayroll(params: PayrollCalculationParams): PayrollCalculationResult {
    const {
      salary,
      payrollSetting,
      attendances,
      bonusAmount = 0,
      deductionsAmount = 0,
      manualOvertimeHours,
      useActualWorkHours = false
    } = params;

    // Validate inputs
    this.validateCalculationInputs(params);

    const basicSalaryAmount = salary.basicSalary;
    const fixedAllowanceAmount = salary.fixedAllowance;
    const hourlyRate = payrollSetting.calculateHourlyRate(basicSalaryAmount);

    let totalWorkHours = 0;
    let overtimeHours = 0;
    let overtimePay = 0;
    let calculationMode: 'ATTENDANCE_BASED' | 'MANUAL' | 'HYBRID' = 'ATTENDANCE_BASED';

    if (useActualWorkHours && attendances.length > 0) {
      // Use actual attendance data
      const workResult = this.calculateWorkHoursFromAttendance(attendances, payrollSetting);
      totalWorkHours = workResult.totalHours;
      overtimeHours = workResult.overtimeHours;
      overtimePay = workResult.overtimePay;
      calculationMode = 'ATTENDANCE_BASED';
    } else if (manualOvertimeHours !== undefined) {
      // Use manual overtime hours
      const normalHours = payrollSetting.normalWorkHoursPerMonth;
      totalWorkHours = normalHours + manualOvertimeHours;
      overtimeHours = manualOvertimeHours;
      overtimePay = this.calculateOvertimePay(manualOvertimeHours, hourlyRate, payrollSetting);
      calculationMode = 'MANUAL';
    } else if (attendances.length > 0) {
      // Hybrid: use attendance for presence but standard overtime calculation
      const workResult = this.calculateWorkHoursFromAttendance(attendances, payrollSetting);
      totalWorkHours = workResult.totalHours;
      overtimeHours = Math.max(0, totalWorkHours - payrollSetting.normalWorkHoursPerMonth);
      overtimePay = this.calculateOvertimePay(overtimeHours, hourlyRate, payrollSetting);
      calculationMode = 'HYBRID';
    } else {
      // Default to normal work hours
      totalWorkHours = payrollSetting.normalWorkHoursPerMonth;
      overtimeHours = 0;
      overtimePay = 0;
      calculationMode = 'MANUAL';
    }

    const grossPay = basicSalaryAmount + fixedAllowanceAmount + overtimePay + bonusAmount;
    const takeHomePay = Math.max(0, grossPay - deductionsAmount);

    return {
      basicSalaryAmount,
      fixedAllowanceAmount,
      totalWorkHours,
      normalWorkHours: payrollSetting.normalWorkHoursPerMonth,
      overtimeHours,
      hourlyRate,
      overtimePay,
      bonusAmount,
      deductionsAmount,
      grossPay,
      takeHomePay,
      calculationMode
    };
  }

  /**
   * Calculate work hours and overtime from attendance records
   */
  private static calculateWorkHoursFromAttendance(
    attendances: Attendance[],
    payrollSetting: PayrollSetting
  ): { totalHours: number; overtimeHours: number; overtimePay: number } {
    let totalHours = 0;
    let overtimeHours = 0;
    let overtimePay = 0;

    const hourlyRate = payrollSetting.calculateHourlyRate(1); // We'll multiply by actual rate later

    for (const attendance of attendances) {
      const dailyHours = attendance.getEffectiveHours();
      totalHours += dailyHours;

      if (payrollSetting.overtimeCalculationType === 'HOURLY') {
        // Calculate daily overtime
        const normalHoursPerDay = payrollSetting.normalWorkHoursPerDay;
        const dailyOvertimeHours = Math.max(0, dailyHours - normalHoursPerDay);
        
        if (dailyOvertimeHours > 0) {
          overtimeHours += dailyOvertimeHours;
          
          // Apply overtime rates based on hours
          const isWeekend = attendance.isWeekend || false;
          const rate = payrollSetting.calculateOvertimeRate(dailyOvertimeHours, isWeekend);
          
          if (dailyOvertimeHours <= 1) {
            overtimePay += dailyOvertimeHours * rate;
          } else {
            // First hour at rate1, remaining at rate2
            overtimePay += 1 * payrollSetting.overtimeRate1;
            overtimePay += (dailyOvertimeHours - 1) * payrollSetting.overtimeRate2;
          }
        }
      }
    }

    if (payrollSetting.overtimeCalculationType === 'MONTHLY') {
      // Calculate monthly overtime
      const monthlyOvertimeHours = Math.max(0, totalHours - payrollSetting.normalWorkHoursPerMonth);
      overtimeHours = monthlyOvertimeHours;
      
      if (monthlyOvertimeHours > 0) {
        overtimePay = monthlyOvertimeHours * payrollSetting.overtimeRate1;
      }
    }

    return { totalHours, overtimeHours, overtimePay };
  }

  /**
   * Calculate overtime pay for manual overtime hours
   */
  private static calculateOvertimePay(
    overtimeHours: number,
    hourlyRate: number,
    payrollSetting: PayrollSetting,
    isWeekend: boolean = false
  ): number {
    if (overtimeHours <= 0) return 0;

    const rate = payrollSetting.calculateOvertimeRate(overtimeHours, isWeekend);
    
    if (payrollSetting.overtimeCalculationType === 'HOURLY') {
      if (overtimeHours <= 1) {
        return overtimeHours * hourlyRate * payrollSetting.overtimeRate1;
      } else {
        // First hour at rate1, remaining at rate2
        return (1 * hourlyRate * payrollSetting.overtimeRate1) + 
               ((overtimeHours - 1) * hourlyRate * payrollSetting.overtimeRate2);
      }
    } else {
      // MONTHLY calculation
      return overtimeHours * hourlyRate * payrollSetting.overtimeRate1;
    }
  }

  /**
   * Validate payroll period business rules
   */
  static validatePayrollPeriod(period: PayrollPeriod): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (period.periodStart >= period.periodEnd) {
      errors.push('Period start date must be before end date');
    }

    const periodDuration = period.getDurationInDays();
    if (periodDuration > 31) {
      errors.push('Payroll period cannot exceed 31 days');
    }

    if (periodDuration < 1) {
      errors.push('Payroll period must be at least 1 day');
    }

    // Check for reasonable period (not too far in the future)
    const maxFutureMonths = 6;
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + maxFutureMonths);
    
    if (period.periodStart > maxFutureDate) {
      errors.push(`Payroll period cannot start more than ${maxFutureMonths} months in the future`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate payroll calculation can be performed
   */
  static canCalculatePayroll(
    salary: Salary,
    payrollSetting: PayrollSetting,
    period: PayrollPeriod
  ): { canCalculate: boolean; reason?: string } {
    if (!salary.isValid()) {
      return { canCalculate: false, reason: 'Invalid salary configuration' };
    }

    if (!period.canBeModified()) {
      return { canCalculate: false, reason: 'Payroll period is finalized and cannot be modified' };
    }

    if (!payrollSetting.validateOvertimeCalculationType()) {
      return { canCalculate: false, reason: 'Invalid overtime calculation type in payroll settings' };
    }

    const periodValidation = this.validatePayrollPeriod(period);
    if (!periodValidation.isValid) {
      return { canCalculate: false, reason: periodValidation.errors.join(', ') };
    }

    return { canCalculate: true };
  }

  /**
   * Generate payroll summary statistics
   */
  static generatePayrollSummary(payrollDetails: PayrollDetail[]): {
    totalStaff: number;
    totalGrossPay: number;
    totalTakeHomePay: number;
    totalOvertimePay: number;
    totalBonuses: number;
    totalDeductions: number;
    totalOvertimeHours: number;
    paidCount: number;
    unpaidCount: number;
    averageTakeHomePay: number;
  } {
    const summary = {
      totalStaff: payrollDetails.length,
      totalGrossPay: 0,
      totalTakeHomePay: 0,
      totalOvertimePay: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      totalOvertimeHours: 0,
      paidCount: 0,
      unpaidCount: 0,
      averageTakeHomePay: 0
    };

    if (payrollDetails.length === 0) return summary;

    for (const detail of payrollDetails) {
      summary.totalGrossPay += detail.getGrossPay();
      summary.totalTakeHomePay += detail.takeHomePay;
      summary.totalOvertimePay += detail.overtimePay;
      summary.totalBonuses += detail.bonusAmount;
      summary.totalDeductions += detail.deductionsAmount;
      summary.totalOvertimeHours += detail.overtimeHours;
      
      if (detail.isPaid) {
        summary.paidCount++;
      } else {
        summary.unpaidCount++;
      }
    }

    summary.averageTakeHomePay = summary.totalTakeHomePay / summary.totalStaff;

    return summary;
  }

  /**
   * Validate calculation inputs
   */
  private static validateCalculationInputs(params: PayrollCalculationParams): void {
    const { salary, payrollSetting, bonusAmount = 0, deductionsAmount = 0 } = params;

    if (!salary.isValid()) {
      throw new Error('Invalid salary configuration');
    }

    if (bonusAmount < 0) {
      throw new Error('Bonus amount cannot be negative');
    }

    if (deductionsAmount < 0) {
      throw new Error('Deductions amount cannot be negative');
    }

    if (!payrollSetting.validateOvertimeCalculationType()) {
      throw new Error('Invalid overtime calculation type in payroll settings');
    }
  }
}