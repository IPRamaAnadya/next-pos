import { ExpenseCategory } from '../entities/ExpenseCategory';
import { ExpenseCategoryQueryOptions } from '../../application/use-cases/interfaces/ExpenseCategoryQueryOptions';

export interface ExpenseCategoryRepository {
  findById(id: string, tenantId: string): Promise<ExpenseCategory | null>;
  findAll(tenantId: string, options: ExpenseCategoryQueryOptions): Promise<PaginatedExpenseCategories>;
  create(category: { tenantId: string; name: string; code: string; isPrivate: boolean }): Promise<ExpenseCategory>;
  update(id: string, tenantId: string, updates: Partial<{ name: string; code: string; isPrivate: boolean }>): Promise<ExpenseCategory>;
  delete(id: string, tenantId: string): Promise<void>;
  findByCode(code: string, tenantId: string): Promise<ExpenseCategory | null>;
  findVisibleToRole(tenantId: string, isCashier: boolean): Promise<ExpenseCategory[]>;
  checkCodeUniqueness(code: string, tenantId: string, excludeId?: string): Promise<boolean>;
  countExpensesByCategory(categoryId: string, tenantId: string): Promise<number>;
}

export interface PaginatedExpenseCategories {
  data: ExpenseCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}