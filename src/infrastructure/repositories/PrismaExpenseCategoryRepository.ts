import { ExpenseCategory } from '../../domain/entities/ExpenseCategory';
import { ExpenseCategoryRepository, PaginatedExpenseCategories } from '../../domain/repositories/ExpenseCategoryRepository';
import { ExpenseCategoryQueryOptions } from '../../application/use-cases/interfaces/ExpenseCategoryQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaExpenseCategoryRepository implements ExpenseCategoryRepository {
  private static instance: PrismaExpenseCategoryRepository;

  private constructor() {}

  public static getInstance(): PrismaExpenseCategoryRepository {
    if (!PrismaExpenseCategoryRepository.instance) {
      PrismaExpenseCategoryRepository.instance = new PrismaExpenseCategoryRepository();
    }
    return PrismaExpenseCategoryRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'tenant_id': 'tenantId',
    'is_private': 'isPrivate',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'name', 'code', 'isPrivate', 'createdAt'
  ]);

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<ExpenseCategory | null> {
    try {
      const category = await prisma.expenseCategory.findUnique({
        where: { id, tenantId },
      });

      if (!category) return null;
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error finding expense category by ID:', error);
      throw new Error(`Failed to find expense category with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: ExpenseCategoryQueryOptions): Promise<PaginatedExpenseCategories> {
    try {
      const { limit, page, sortBy, sortDir, search, code, isPrivate, isCashier } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply search filter (searches both name and code)
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search.toUpperCase(), mode: 'insensitive' } },
        ];
      }

      if (code) {
        whereClause.code = { contains: code.toUpperCase(), mode: 'insensitive' };
      }

      if (isPrivate !== undefined) {
        whereClause.isPrivate = isPrivate;
      }

      // For cashier, only show non-private categories
      if (isCashier) {
        whereClause.isPrivate = false;
      }

      const totalCount = await prisma.expenseCategory.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const categories = await prisma.expenseCategory.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: categories.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding expense categories:', error);
      throw new Error('Failed to retrieve expense categories');
    }
  }

  async create(data: { tenantId: string; name: string; code: string; isPrivate: boolean }): Promise<ExpenseCategory> {
    try {
      const category = await prisma.expenseCategory.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          code: data.code,
          isPrivate: data.isPrivate,
        },
      });
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error creating expense category:', error);
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new Error('Category code already exists in this tenant');
      }
      throw new Error('Failed to create expense category');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<{ name: string; code: string; isPrivate: boolean }>): Promise<ExpenseCategory> {
    try {
      const category = await prisma.expenseCategory.update({
        where: { id, tenantId },
        data: updates,
      });
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error updating expense category:', error);
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new Error('Category code already exists in this tenant');
      }
      throw new Error('Failed to update expense category');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.expenseCategory.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting expense category:', error);
      throw new Error('Failed to delete expense category');
    }
  }

  async findByCode(code: string, tenantId: string): Promise<ExpenseCategory | null> {
    try {
      const category = await prisma.expenseCategory.findFirst({
        where: { 
          code: code.toUpperCase(),
          tenantId 
        },
      });
      if (!category) return null;
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error finding expense category by code:', error);
      throw new Error('Failed to find expense category by code');
    }
  }

  async findVisibleToRole(tenantId: string, isCashier: boolean): Promise<ExpenseCategory[]> {
    try {
      const whereClause: any = { tenantId };
      
      if (isCashier) {
        whereClause.isPrivate = false;
      }

      const categories = await prisma.expenseCategory.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
      });
      return categories.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding visible categories:', error);
      throw new Error('Failed to find visible categories');
    }
  }

  async checkCodeUniqueness(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        code: code.toUpperCase(),
        tenantId,
      };

      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const existingCategory = await prisma.expenseCategory.findFirst({
        where: whereClause,
      });

      return existingCategory === null;
    } catch (error) {
      console.error('Error checking code uniqueness:', error);
      throw new Error('Failed to check code uniqueness');
    }
  }

  async countExpensesByCategory(categoryId: string, tenantId: string): Promise<number> {
    try {
      const count = await prisma.expense.count({
        where: {
          expenseCategoryId: categoryId,
          tenantId,
        },
      });
      return count;
    } catch (error) {
      console.error('Error counting expenses by category:', error);
      throw new Error('Failed to count expenses by category');
    }
  }

  private mapToEntity(data: any): ExpenseCategory {
    return new ExpenseCategory(
      data.id,
      data.tenantId,
      data.name,
      data.code,
      data.isPrivate || false,
      data.createdAt,
    );
  }
}