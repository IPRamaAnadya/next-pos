import { Expense } from '../../domain/entities/Expense';
import { ExpenseRepository, PaginatedExpenses } from '../../domain/repositories/ExpenseRepository';
import { ExpenseQueryOptions } from '../../application/use-cases/interfaces/ExpenseQueryOptions';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class PrismaExpenseRepository implements ExpenseRepository {
  private static instance: PrismaExpenseRepository;

  private constructor() {}

  public static getInstance(): PrismaExpenseRepository {
    if (!PrismaExpenseRepository.instance) {
      PrismaExpenseRepository.instance = new PrismaExpenseRepository();
    }
    return PrismaExpenseRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'expense_category_id': 'expenseCategoryId',
    'staff_id': 'staffId',
    'paid_at': 'paidAt',
    'attachment_url': 'attachmentUrl',
    'payment_type': 'paymentType',
    'is_show': 'isShow',
    'payroll_detail_id': 'payrollDetailId',
    'tenant_id': 'tenantId',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'expenseCategoryId', 'staffId', 'description', 
    'amount', 'paymentType', 'isShow', 'paidAt', 'attachmentUrl', 
    'payrollDetailId', 'createdAt'
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

  async findById(id: string, tenantId: string): Promise<Expense | null> {
    try {
      const expense = await prisma.expense.findUnique({
        where: { id, tenantId },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      if (!expense) return null;
      return this.mapToEntity(expense);
    } catch (error) {
      console.error('Error finding expense by ID:', error);
      throw new Error(`Failed to find expense with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: ExpenseQueryOptions): Promise<PaginatedExpenses> {
    try {
      const { limit, page, sortBy, sortDir, filters, isCashier } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.description) {
        whereClause.description = { contains: filters.description, mode: 'insensitive' };
      }

      if (filters?.expenseCategoryId) {
        whereClause.expenseCategoryId = filters.expenseCategoryId;
      }

      if (filters?.staffId) {
        whereClause.staffId = filters.staffId;
      }

      if (filters?.paymentType) {
        whereClause.paymentType = filters.paymentType;
      }

      if (filters?.isShow !== undefined) {
        whereClause.isShow = filters.isShow;
      }

      if (filters?.isPaid !== undefined) {
        if (filters.isPaid) {
          whereClause.paidAt = { not: null };
        } else {
          whereClause.paidAt = null;
        }
      }

      if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
        whereClause.amount = {};
        if (filters.minAmount !== undefined) {
          whereClause.amount.gte = new Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          whereClause.amount.lte = new Decimal(filters.maxAmount);
        }
      }

      if (filters?.startDate || filters?.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) {
          whereClause.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.createdAt.lte = filters.endDate;
        }
      }

      // For cashier, only show non-private expenses
      if (isCashier) {
        whereClause.expenseCategory = { isPrivate: false };
        whereClause.isShow = true;
      }

      const totalCount = await prisma.expense.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const expenses = await prisma.expense.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return {
        data: expenses.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding expenses:', error);
      throw new Error('Failed to retrieve expenses');
    }
  }

  async create(data: any): Promise<Expense> {
    try {
      const expense = await prisma.expense.create({
        data: {
          tenantId: data.tenantId,
          expenseCategoryId: data.expenseCategoryId,
          staffId: data.staffId,
          description: data.description,
          amount: data.amount,
          paymentType: data.paymentType,
          isShow: data.isShow,
          paidAt: data.paidAt,
          attachmentUrl: data.attachmentUrl,
          payrollDetailId: data.payrollDetailId,
        },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
      return this.mapToEntity(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  }

  async update(id: string, tenantId: string, updates: any): Promise<Expense> {
    try {
      const expense = await prisma.expense.update({
        where: { id, tenantId },
        data: updates,
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
      return this.mapToEntity(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.expense.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  async findByCategory(categoryId: string, tenantId: string): Promise<Expense[]> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { 
          expenseCategoryId: categoryId,
          tenantId 
        },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return expenses.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding expenses by category:', error);
      throw new Error('Failed to find expenses by category');
    }
  }

  async findByStaff(staffId: string, tenantId: string): Promise<Expense[]> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { 
          staffId,
          tenantId 
        },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return expenses.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding expenses by staff:', error);
      throw new Error('Failed to find expenses by staff');
    }
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      const expenses = await prisma.expense.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              code: true,
              isPrivate: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return expenses.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding expenses by date range:', error);
      throw new Error('Failed to find expenses by date range');
    }
  }

  async getTotalAmountByCategory(tenantId: string, categoryId: string): Promise<number> {
    try {
      const result = await prisma.expense.aggregate({
        where: {
          tenantId,
          expenseCategoryId: categoryId,
        },
        _sum: {
          amount: true,
        },
      });
      return result._sum.amount?.toNumber() || 0;
    } catch (error) {
      console.error('Error getting total amount by category:', error);
      throw new Error('Failed to get total amount by category');
    }
  }

  private mapToEntity(data: any): Expense {
    return new Expense(
      data.id,
      data.tenantId,
      data.expenseCategoryId,
      data.staffId,
      data.description,
      data.amount,
      data.paymentType,
      data.isShow,
      data.paidAt,
      data.attachmentUrl,
      data.payrollDetailId,
      data.createdAt,
      data.expenseCategory ? {
        id: data.expenseCategory.id,
        name: data.expenseCategory.name,
        code: data.expenseCategory.code,
        isPrivate: data.expenseCategory.isPrivate,
      } : undefined,
      data.staff ? {
        id: data.staff.id,
        username: data.staff.username,
        role: data.staff.role,
      } : undefined
    );
  }
}