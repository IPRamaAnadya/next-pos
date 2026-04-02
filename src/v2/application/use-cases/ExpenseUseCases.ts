import { Expense } from '../../domain/entities/Expense';
import { ExpenseRepository } from '../../domain/repositories/ExpenseRepository';
import { ExpenseQueryOptions } from './interfaces/ExpenseQueryOptions';
import { ExpenseDomainService } from '../../domain/services/ExpenseDomainService';
import { Decimal } from '@prisma/client/runtime/library';

export class ExpenseUseCases {
  private static instance: ExpenseUseCases;

  private constructor(private expenseRepository: ExpenseRepository) {}

  public static getInstance(expenseRepository: ExpenseRepository): ExpenseUseCases {
    if (!ExpenseUseCases.instance) {
      ExpenseUseCases.instance = new ExpenseUseCases(expenseRepository);
    }
    return ExpenseUseCases.instance;
  }

  async getExpenses(tenantId: string, options: ExpenseQueryOptions) {
    const result = await this.expenseRepository.findAll(tenantId, options);
    
    // Apply business rules for cashier visibility
    if (options.isCashier) {
      result.data = ExpenseDomainService.filterVisibleExpenses(result.data, true);
    }
    
    return result;
  }

  async getExpenseById(id: string, tenantId: string, isCashier: boolean = false) {
    const expense = await this.expenseRepository.findById(id, tenantId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Check if cashier can view this expense
    if (isCashier && !expense.canBeViewedBy(true)) {
      throw new Error('Access denied: Cannot view private expense');
    }

    return expense;
  }

  async createExpense(data: {
    tenantId: string;
    expenseCategoryId: string;
    staffId: string;
    description: string;
    amount: number | Decimal;
    paymentType?: string;
    isShow?: boolean;
    paidAt?: Date | null;
    attachmentUrl?: string | null;
    payrollDetailId?: string | null;
  }) {
    // Convert amount to Decimal if it's a number
    const amount = typeof data.amount === 'number' ? new Decimal(data.amount) : data.amount;
    
    // Business validation
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Expense description is required');
    }

    ExpenseDomainService.validateAmount(amount);
    
    if (data.paymentType) {
      ExpenseDomainService.validatePaymentType(data.paymentType);
    }

    // Check if expense category and staff exist in the same tenant
    // This would typically involve checking via other repositories
    
    const expenseData = {
      tenantId: data.tenantId,
      expenseCategoryId: data.expenseCategoryId,
      staffId: data.staffId,
      description: data.description.trim(),
      amount,
      paymentType: data.paymentType || 'Cash',
      isShow: data.isShow ?? true,
      paidAt: data.paidAt || null,
      attachmentUrl: data.attachmentUrl || null,
      payrollDetailId: data.payrollDetailId || null,
    };

    return await this.expenseRepository.create(expenseData as any);
  }

  async updateExpense(id: string, tenantId: string, updates: {
    expenseCategoryId?: string;
    staffId?: string;
    description?: string;
    amount?: number | Decimal;
    paymentType?: string;
    isShow?: boolean;
    paidAt?: Date | null;
    attachmentUrl?: string | null;
    payrollDetailId?: string | null;
  }) {
    const existingExpense = await this.getExpenseById(id, tenantId);
    
    // Business validation for updates
    if (updates.description !== undefined) {
      if (!updates.description || updates.description.trim().length === 0) {
        throw new Error('Expense description is required');
      }
      if (updates.description.trim().length < 3) {
        throw new Error('Expense description must be at least 3 characters long');
      }
    }

    if (updates.amount !== undefined) {
      const amount = typeof updates.amount === 'number' ? new Decimal(updates.amount) : updates.amount;
      ExpenseDomainService.validateAmount(amount);
      updates.amount = amount;
    }

    if (updates.paymentType) {
      ExpenseDomainService.validatePaymentType(updates.paymentType);
    }

    return await this.expenseRepository.update(id, tenantId, updates as any);
  }

  async deleteExpense(id: string, tenantId: string) {
    await this.getExpenseById(id, tenantId); // Ensure exists
    await this.expenseRepository.delete(id, tenantId);
  }

  async getExpensesByCategory(categoryId: string, tenantId: string) {
    return await this.expenseRepository.findByCategory(categoryId, tenantId);
  }

  async getExpensesByStaff(staffId: string, tenantId: string) {
    return await this.expenseRepository.findByStaff(staffId, tenantId);
  }

  async getExpensesByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
    return await this.expenseRepository.findByDateRange(tenantId, startDate, endDate);
  }

  async getTotalExpensesByCategory(tenantId: string, categoryId: string) {
    return await this.expenseRepository.getTotalAmountByCategory(tenantId, categoryId);
  }

  async markExpenseAsPaid(id: string, tenantId: string, paidAt?: Date) {
    const expense = await this.getExpenseById(id, tenantId);
    
    if (expense.isPaid()) {
      throw new Error('Expense is already marked as paid');
    }

    return await this.expenseRepository.update(id, tenantId, {
      paidAt: paidAt || new Date(),
    });
  }

  async markExpenseAsUnpaid(id: string, tenantId: string) {
    const expense = await this.getExpenseById(id, tenantId);
    
    if (!expense.isPaid()) {
      throw new Error('Expense is already unpaid');
    }

    return await this.expenseRepository.update(id, tenantId, {
      paidAt: null,
    });
  }
}