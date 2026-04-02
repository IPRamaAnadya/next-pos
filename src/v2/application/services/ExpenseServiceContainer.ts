import { ExpenseUseCases } from '../use-cases/ExpenseUseCases';
import { PrismaExpenseRepository } from '../../infrastructure/repositories/PrismaExpenseRepository';

export class ExpenseServiceContainer {
  private static expenseUseCases: ExpenseUseCases;

  static getExpenseUseCases(): ExpenseUseCases {
    if (!this.expenseUseCases) {
      const expenseRepository = PrismaExpenseRepository.getInstance();
      this.expenseUseCases = ExpenseUseCases.getInstance(expenseRepository);
    }
    return this.expenseUseCases;
  }
}