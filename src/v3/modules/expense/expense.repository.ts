import prisma from '@/v3/lib/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import { ExpenseCategoryEntity, ExpenseEntity } from './expense.entity';
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  ExpenseCategoryQueryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQueryInput,
} from './expense.type';

// ─────────────────────────────────────────────
//  Category repository
// ─────────────────────────────────────────────

export interface IExpenseCategoryRepository {
  findAll(tenantId: string, query: ExpenseCategoryQueryInput): Promise<{ items: ExpenseCategoryEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null>;
  findByCode(code: string, tenantId: string, excludeId?: string): Promise<ExpenseCategoryEntity | null>;
  countExpenses(id: string, tenantId: string): Promise<number>;
  create(tenantId: string, data: CreateExpenseCategoryInput): Promise<ExpenseCategoryEntity>;
  update(id: string, tenantId: string, data: UpdateExpenseCategoryInput): Promise<ExpenseCategoryEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

class PrismaExpenseCategoryRepository implements IExpenseCategoryRepository {
  async findAll(
    tenantId: string,
    query: ExpenseCategoryQueryInput,
  ): Promise<{ items: ExpenseCategoryEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.isPrivate !== undefined && { isPrivate: query.isPrivate }),
    };

    const [rows, total] = await Promise.all([
      prisma.expenseCategory.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
      prisma.expenseCategory.count({ where }),
    ]);

    return { items: rows.map((r) => new ExpenseCategoryEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null> {
    const row = await prisma.expenseCategory.findFirst({ where: { id, tenantId } });
    return row ? new ExpenseCategoryEntity(row) : null;
  }

  async findByCode(code: string, tenantId: string, excludeId?: string): Promise<ExpenseCategoryEntity | null> {
    const row = await prisma.expenseCategory.findFirst({
      where: { code, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return row ? new ExpenseCategoryEntity(row) : null;
  }

  async countExpenses(id: string, tenantId: string): Promise<number> {
    return prisma.expense.count({ where: { expenseCategoryId: id, tenantId } });
  }

  async create(tenantId: string, data: CreateExpenseCategoryInput): Promise<ExpenseCategoryEntity> {
    const row = await prisma.expenseCategory.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code.toUpperCase(),
        isPrivate: data.isPrivate ?? false,
      },
    });
    return new ExpenseCategoryEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateExpenseCategoryInput): Promise<ExpenseCategoryEntity> {
    const row = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code.toUpperCase() }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
      },
    });
    return new ExpenseCategoryEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.expenseCategory.deleteMany({ where: { id, tenantId } });
  }
}

export const expenseCategoryRepository = new PrismaExpenseCategoryRepository();

// ─────────────────────────────────────────────
//  Expense repository
// ─────────────────────────────────────────────

export interface IExpenseRepository {
  findAll(tenantId: string, query: ExpenseQueryInput): Promise<{ items: ExpenseEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ExpenseEntity | null>;
  create(tenantId: string, data: CreateExpenseInput): Promise<ExpenseEntity>;
  update(id: string, tenantId: string, data: UpdateExpenseInput): Promise<ExpenseEntity>;
  markPaid(id: string, tenantId: string, paidAt: Date): Promise<ExpenseEntity>;
  markUnpaid(id: string, tenantId: string): Promise<ExpenseEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

const expenseInclude = { expenseCategory: true, staff: true } as const;

class PrismaExpenseRepository implements IExpenseRepository {
  async findAll(
    tenantId: string,
    query: ExpenseQueryInput,
  ): Promise<{ items: ExpenseEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }
    if (query.expenseCategoryId) where.expenseCategoryId = query.expenseCategoryId;
    if (query.staffId) where.staffId = query.staffId;
    if (query.paymentType) where.paymentType = query.paymentType;
    if (query.isShow !== undefined) where.isShow = query.isShow;
    if (query.isPaid === true) where.paidAt = { not: null };
    if (query.isPaid === false) where.paidAt = null;
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      where.createdAt = dateFilter;
    }
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      const amountFilter: Record<string, Decimal> = {};
      if (query.minAmount !== undefined) amountFilter.gte = new Decimal(query.minAmount);
      if (query.maxAmount !== undefined) amountFilter.lte = new Decimal(query.maxAmount);
      where.amount = amountFilter;
    }

    const [rows, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
    ]);

    return { items: rows.map((r) => new ExpenseEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<ExpenseEntity | null> {
    const row = await prisma.expense.findFirst({ where: { id, tenantId }, include: expenseInclude });
    return row ? new ExpenseEntity(row) : null;
  }

  async create(tenantId: string, data: CreateExpenseInput): Promise<ExpenseEntity> {
    const row = await prisma.expense.create({
      data: {
        tenantId,
        expenseCategoryId: data.expenseCategoryId,
        staffId: data.staffId,
        description: data.description,
        amount: new Decimal(data.amount),
        paymentType: data.paymentType ?? 'Cash',
        isShow: data.isShow ?? true,
        paidAt: data.paidAt ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        payrollDetailId: data.payrollDetailId ?? null,
      },
      include: expenseInclude,
    });
    return new ExpenseEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateExpenseInput): Promise<ExpenseEntity> {
    const row = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.expenseCategoryId !== undefined && { expenseCategoryId: data.expenseCategoryId }),
        ...(data.staffId !== undefined && { staffId: data.staffId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
        ...(data.paymentType !== undefined && { paymentType: data.paymentType }),
        ...(data.isShow !== undefined && { isShow: data.isShow }),
        ...(data.paidAt !== undefined && { paidAt: data.paidAt }),
        ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl }),
        ...(data.payrollDetailId !== undefined && { payrollDetailId: data.payrollDetailId }),
      },
      include: expenseInclude,
    });
    return new ExpenseEntity(row);
  }

  async markPaid(id: string, tenantId: string, paidAt: Date): Promise<ExpenseEntity> {
    const row = await prisma.expense.update({
      where: { id },
      data: { paidAt },
      include: expenseInclude,
    });
    return new ExpenseEntity(row);
  }

  async markUnpaid(id: string, tenantId: string): Promise<ExpenseEntity> {
    const row = await prisma.expense.update({
      where: { id },
      data: { paidAt: null },
      include: expenseInclude,
    });
    return new ExpenseEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.expense.deleteMany({ where: { id, tenantId } });
  }
}

export const expenseRepository = new PrismaExpenseRepository();
