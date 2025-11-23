import { ShiftUseCases } from '../use-cases/ShiftUseCases';
import { PrismaShiftRepository } from '../../infrastructure/repositories/PrismaShiftRepository';

export class ShiftServiceContainer {
  private static shiftUseCases: ShiftUseCases;

  static getShiftUseCases(): ShiftUseCases {
    if (!this.shiftUseCases) {
      const shiftRepository = PrismaShiftRepository.getInstance();
      this.shiftUseCases = ShiftUseCases.getInstance(shiftRepository);
    }
    return this.shiftUseCases;
  }
}