import { StaffUseCases } from '../use-cases/StaffUseCases';
import { PrismaStaffRepository } from '../../infrastructure/repositories/PrismaStaffRepository';
import { PrismaSalaryRepository } from '../../infrastructure/repositories/PrismaSalaryRepository';
import { PrismaAttendanceRepository } from '../../infrastructure/repositories/PrismaAttendanceRepository';
import { PrismaPayrollDetailRepositoryV2 } from '../../infrastructure/repositories/PrismaPayrollDetailRepositoryV2';

export class StaffServiceContainer {
  private static staffUseCases: StaffUseCases;

  static getStaffUseCases(): StaffUseCases {
    if (!this.staffUseCases) {
      const staffRepository = PrismaStaffRepository.getInstance();
      const salaryRepository = PrismaSalaryRepository.getInstance();
      const attendanceRepository = PrismaAttendanceRepository.getInstance();
      const payrollDetailRepository = PrismaPayrollDetailRepositoryV2.getInstance();
      
      this.staffUseCases = StaffUseCases.getInstance(
        staffRepository,
        salaryRepository,
        attendanceRepository,
        payrollDetailRepository
      );
    }
    return this.staffUseCases;
  }
}