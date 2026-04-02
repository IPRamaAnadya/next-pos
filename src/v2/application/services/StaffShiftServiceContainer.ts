import { StaffShiftUseCases } from '../use-cases/StaffShiftUseCases';
import { PrismaStaffShiftRepository } from '../../infrastructure/repositories/PrismaStaffShiftRepository';
import { PrismaShiftRepository } from '../../infrastructure/repositories/PrismaShiftRepository';

export class StaffShiftServiceContainer {
  private static staffShiftUseCases: StaffShiftUseCases;

  static getStaffShiftUseCases(): StaffShiftUseCases {
    if (!this.staffShiftUseCases) {
      const staffShiftRepository = PrismaStaffShiftRepository.getInstance();
      const shiftRepository = PrismaShiftRepository.getInstance();
      this.staffShiftUseCases = StaffShiftUseCases.getInstance(staffShiftRepository, shiftRepository);
    }
    return this.staffShiftUseCases;
  }
}