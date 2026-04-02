import { DiscountUseCases } from '../use-cases/DiscountUseCases';
import { PrismaDiscountRepository } from '../../infrastructure/repositories/PrismaDiscountRepository';

export class DiscountServiceContainer {
  private static discountUseCases: DiscountUseCases;

  static getDiscountUseCases(): DiscountUseCases {
    if (!this.discountUseCases) {
      const discountRepository = PrismaDiscountRepository.getInstance();
      this.discountUseCases = DiscountUseCases.getInstance(discountRepository);
    }
    return this.discountUseCases;
  }
}