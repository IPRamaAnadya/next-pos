import type { Expense, ExpenseCategory, Staff } from '@/app/generated/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { ExpenseCategoryProfile, ExpenseProfile } from './expense.type';

// ─────────────────────────────────────────────
//  ExpenseCategoryEntity
// ─────────────────────────────────────────────

export class ExpenseCategoryEntity {
  constructor(readonly category: ExpenseCategory) {}

  isPrivate(): boolean {
    return this.category.isPrivate ?? false;
  }

  toProfile(): ExpenseCategoryProfile {
    const c = this.category;
    return {
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      code: c.code,
      isPrivate: c.isPrivate ?? false,
      createdAt: c.createdAt ?? null,
    };
  }
}

// ─────────────────────────────────────────────
//  ExpenseEntity
// ─────────────────────────────────────────────

export class ExpenseEntity {
  constructor(
    readonly expense: Expense & {
      expenseCategory?: ExpenseCategory | null;
      staff?: Staff | null;
    },
  ) {}

  isPaid(): boolean {
    return this.expense.paidAt !== null;
  }

  isVisible(): boolean {
    return this.expense.isShow;
  }

  getAmount(): number {
    const a = this.expense.amount;
    return a instanceof Decimal ? a.toNumber() : Number(a);
  }

  toProfile(): ExpenseProfile {
    const e = this.expense;
    return {
      id: e.id,
      tenantId: e.tenantId,
      expenseCategoryId: e.expenseCategoryId,
      staffId: e.staffId,
      description: e.description,
      amount: this.getAmount(),
      paymentType: e.paymentType,
      isShow: e.isShow,
      isPaid: this.isPaid(),
      paidAt: e.paidAt ?? null,
      attachmentUrl: e.attachmentUrl ?? null,
      payrollDetailId: e.payrollDetailId ?? null,
      createdAt: e.createdAt ?? null,
      expenseCategory: e.expenseCategory
        ? new ExpenseCategoryEntity(e.expenseCategory).toProfile()
        : null,
      staff: e.staff
        ? { id: e.staff.id, username: e.staff.username, role: e.staff.role }
        : null,
    };
  }
}
