import { expenseCategoryRepository, expenseRepository } from './expense.repository';
import { VALID_PAYMENT_TYPES } from './expense.type';
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  ExpenseCategoryQueryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQueryInput,
  MarkPaidInput,
} from './expense.type';

const CODE_REGEX = /^[A-Z0-9_]+$/;

// ─────────────────────────────────────────────
//  ExpenseCategoryService
// ─────────────────────────────────────────────

class ExpenseCategoryService {
  async listCategories(tenantId: string, query: ExpenseCategoryQueryInput) {
    const { items, total } = await expenseCategoryRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getCategory(id: string, tenantId: string) {
    const entity = await expenseCategoryRepository.findById(id, tenantId);
    if (!entity) throw new Error('Expense category not found');
    return entity.toProfile();
  }

  async createCategory(tenantId: string, input: CreateExpenseCategoryInput) {
    if (!input.name?.trim()) throw new Error('Category name is required');
    if (!input.code?.trim()) throw new Error('Category code is required');

    const code = input.code.trim().toUpperCase();
    if (!CODE_REGEX.test(code)) {
      throw new Error('Code must contain only letters, numbers, and underscores');
    }

    const existing = await expenseCategoryRepository.findByCode(code, tenantId);
    if (existing) throw new Error('A category with this code already exists');

    const entity = await expenseCategoryRepository.create(tenantId, {
      ...input,
      name: input.name.trim(),
      code,
    });
    return entity.toProfile();
  }

  async updateCategory(id: string, tenantId: string, input: UpdateExpenseCategoryInput) {
    const existing = await expenseCategoryRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense category not found');

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (!CODE_REGEX.test(code)) {
        throw new Error('Code must contain only letters, numbers, and underscores');
      }
      const dup = await expenseCategoryRepository.findByCode(code, tenantId, id);
      if (dup) throw new Error('A category with this code already exists');
      input = { ...input, code };
    }
    if (input.name !== undefined) {
      input = { ...input, name: input.name.trim() };
    }

    const entity = await expenseCategoryRepository.update(id, tenantId, input);
    return entity.toProfile();
  }

  async deleteCategory(id: string, tenantId: string) {
    const existing = await expenseCategoryRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense category not found');

    const count = await expenseCategoryRepository.countExpenses(id, tenantId);
    if (count > 0) throw new Error('Cannot delete a category that has expenses');

    await expenseCategoryRepository.delete(id, tenantId);
  }
}

export const expenseCategoryService = new ExpenseCategoryService();

// ─────────────────────────────────────────────
//  ExpenseService
// ─────────────────────────────────────────────

class ExpenseService {
  async listExpenses(tenantId: string, query: ExpenseQueryInput) {
    const { items, total } = await expenseRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getExpense(id: string, tenantId: string) {
    const entity = await expenseRepository.findById(id, tenantId);
    if (!entity) throw new Error('Expense not found');
    return entity.toProfile();
  }

  async createExpense(tenantId: string, input: CreateExpenseInput) {
    if (!input.expenseCategoryId) throw new Error('expenseCategoryId is required');
    if (!input.staffId) throw new Error('staffId is required');
    if (!input.description?.trim()) throw new Error('Description is required');
    if (input.amount == null || input.amount <= 0) throw new Error('Amount must be greater than 0');

    if (input.paymentType !== undefined && !VALID_PAYMENT_TYPES.includes(input.paymentType as never)) {
      throw new Error(`paymentType must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`);
    }

    const category = await expenseCategoryRepository.findById(input.expenseCategoryId, tenantId);
    if (!category) throw new Error('Expense category not found');

    const entity = await expenseRepository.create(tenantId, {
      ...input,
      description: input.description.trim(),
    });
    return entity.toProfile();
  }

  async updateExpense(id: string, tenantId: string, input: UpdateExpenseInput) {
    const existing = await expenseRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense not found');

    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (input.paymentType !== undefined && !VALID_PAYMENT_TYPES.includes(input.paymentType as never)) {
      throw new Error(`paymentType must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`);
    }
    if (input.expenseCategoryId !== undefined) {
      const category = await expenseCategoryRepository.findById(input.expenseCategoryId, tenantId);
      if (!category) throw new Error('Expense category not found');
    }
    if (input.description !== undefined) {
      input = { ...input, description: input.description.trim() };
    }

    const entity = await expenseRepository.update(id, tenantId, input);
    return entity.toProfile();
  }

  async markAsPaid(id: string, tenantId: string, input: MarkPaidInput) {
    const existing = await expenseRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense not found');
    if (existing.isPaid()) throw new Error('Expense is already marked as paid');

    const paidAt = input.paidAt ?? new Date();
    const entity = await expenseRepository.markPaid(id, tenantId, paidAt);
    return entity.toProfile();
  }

  async markAsUnpaid(id: string, tenantId: string) {
    const existing = await expenseRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense not found');
    if (!existing.isPaid()) throw new Error('Expense is not marked as paid');

    const entity = await expenseRepository.markUnpaid(id, tenantId);
    return entity.toProfile();
  }

  async deleteExpense(id: string, tenantId: string) {
    const existing = await expenseRepository.findById(id, tenantId);
    if (!existing) throw new Error('Expense not found');
    await expenseRepository.delete(id, tenantId);
  }
}

export const expenseService = new ExpenseService();
