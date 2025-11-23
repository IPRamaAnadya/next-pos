import { PayrollUseCases } from '../usecases/PayrollUseCases';
import { PrismaPayrollPeriodRepository } from '../../infrastructure/repositories/PrismaPayrollPeriodRepository';
import { PrismaPayrollDetailRepositoryV2 } from '../../infrastructure/repositories/PrismaPayrollDetailRepositoryV2';
import { PrismaPayrollSettingRepository } from '../../infrastructure/repositories/PrismaPayrollSettingRepository';
import { PrismaSalaryRepository } from '../../infrastructure/repositories/PrismaSalaryRepository';
import { PrismaAttendanceRepository } from '../../infrastructure/repositories/PrismaAttendanceRepository';

export class PayrollServiceContainer {
  private static payrollUseCases: PayrollUseCases;

  public static getPayrollUseCases(): PayrollUseCases {
    if (!PayrollServiceContainer.payrollUseCases) {
      // Initialize repositories
      const payrollPeriodRepository = PrismaPayrollPeriodRepository.getInstance();
      const payrollDetailRepository = PrismaPayrollDetailRepositoryV2.getInstance();
      const payrollSettingRepository = PrismaPayrollSettingRepository.getInstance();
      const salaryRepository = PrismaSalaryRepository.getInstance();
      const attendanceRepository = PrismaAttendanceRepository.getInstance();

      // Initialize use cases
      PayrollServiceContainer.payrollUseCases = PayrollUseCases.getInstance(
        payrollPeriodRepository,
        payrollDetailRepository,
        payrollSettingRepository,
        salaryRepository,
        attendanceRepository
      );
    }

    return PayrollServiceContainer.payrollUseCases;
  }
}