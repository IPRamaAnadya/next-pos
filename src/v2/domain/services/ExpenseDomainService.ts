import { Expense } from '../entities/Expense';
import { Decimal } from '@prisma/client/runtime/library';

export class ExpenseDomainService {
  static validateBusinessRules(expense: Expense): void {
    if (!expense.isValid()) {
      throw new Error('Invalid expense data: description and amount are required');
    }

    if (expense.amount.toNumber() <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }

    if (expense.description.trim().length < 3) {
      throw new Error('Expense description must be at least 3 characters long');
    }
  }

  static validateAmount(amount: Decimal | number): void {
    const numericAmount = typeof amount === 'number' ? amount : amount.toNumber();
    
    if (numericAmount < 0) {
      throw new Error('Expense amount cannot be negative');
    }

    if (numericAmount > 1000000000) { // 1 billion limit
      throw new Error('Expense amount exceeds maximum allowed limit');
    }
  }

  static validatePaymentType(paymentType: string): void {
    const validPaymentTypes = ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'E-Wallet'];
    
    if (!validPaymentTypes.includes(paymentType)) {
      throw new Error(`Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`);
    }
  }

  static calculateTotalExpenses(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => {
      return total + expense.getAmountAsNumber();
    }, 0);
  }

  static filterVisibleExpenses(expenses: Expense[], isCashier: boolean): Expense[] {
    return expenses.filter(expense => expense.canBeViewedBy(isCashier));
  }

  static groupExpensesByCategory(expenses: Expense[]): Record<string, Expense[]> {
    return expenses.reduce((groups, expense) => {
      const categoryId = expense.expenseCategoryId;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);
  }
}