import { ExpenseCategoryUseCases } from '../use-cases/ExpenseCategoryUseCases';
import { PrismaExpenseCategoryRepository } from '../../infrastructure/repositories/PrismaExpenseCategoryRepository';

export class ExpenseCategoryServiceContainer {
  private static expenseCategoryUseCases: ExpenseCategoryUseCases;

  static getExpenseCategoryUseCases(): ExpenseCategoryUseCases {
    if (!this.expenseCategoryUseCases) {
      const expenseCategoryRepository = PrismaExpenseCategoryRepository.getInstance();
      this.expenseCategoryUseCases = ExpenseCategoryUseCases.getInstance(expenseCategoryRepository);
    }
    return this.expenseCategoryUseCases;
  }
}