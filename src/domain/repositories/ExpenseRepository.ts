import { Expense } from '../entities/Expense';
import { ExpenseQueryOptions } from '../../application/use-cases/interfaces/ExpenseQueryOptions';

export interface ExpenseRepository {
  findById(id: string, tenantId: string): Promise<Expense | null>;
  findAll(tenantId: string, options: ExpenseQueryOptions): Promise<PaginatedExpenses>;
  create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  update(id: string, tenantId: string, updates: Partial<Expense>): Promise<Expense>;
  delete(id: string, tenantId: string): Promise<void>;
  findByCategory(categoryId: string, tenantId: string): Promise<Expense[]>;
  findByStaff(staffId: string, tenantId: string): Promise<Expense[]>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  getTotalAmountByCategory(tenantId: string, categoryId: string): Promise<number>;
}

export interface PaginatedExpenses {
  data: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}