// ─────────────────────────────────────────────
//  Enum-like types
// ─────────────────────────────────────────────

export type PaymentType = 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Debit Card' | 'E-Wallet';

export const VALID_PAYMENT_TYPES: PaymentType[] = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'E-Wallet',
];

// ─────────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────────

export interface ExpenseCategoryProfile {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isPrivate: boolean | null;
  createdAt: Date | null;
}

export interface ExpenseProfile {
  id: string;
  tenantId: string;
  expenseCategoryId: string;
  staffId: string;
  description: string;
  amount: number;
  paymentType: string;
  isShow: boolean;
  isPaid: boolean;
  paidAt: Date | null;
  attachmentUrl: string | null;
  payrollDetailId: string | null;
  createdAt: Date | null;
  expenseCategory?: ExpenseCategoryProfile | null;
  staff?: { id: string; username: string; role: string } | null;
}

// ─────────────────────────────────────────────
//  Input types — Category
// ─────────────────────────────────────────────

export interface CreateExpenseCategoryInput {
  name: string;
  code: string;
  isPrivate?: boolean;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  code?: string;
  isPrivate?: boolean;
}

export interface ExpenseCategoryQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  isPrivate?: boolean;
}

// ─────────────────────────────────────────────
//  Input types — Expense
// ─────────────────────────────────────────────

export interface CreateExpenseInput {
  expenseCategoryId: string;
  staffId: string;
  description: string;
  amount: number;
  paymentType?: string;
  isShow?: boolean;
  paidAt?: Date | null;
  attachmentUrl?: string;
  payrollDetailId?: string;
}

export interface UpdateExpenseInput {
  expenseCategoryId?: string;
  staffId?: string;
  description?: string;
  amount?: number;
  paymentType?: string;
  isShow?: boolean;
  paidAt?: Date | null;
  attachmentUrl?: string | null;
  payrollDetailId?: string | null;
}

export interface ExpenseQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;          // description
  expenseCategoryId?: string;
  staffId?: string;
  paymentType?: string;
  isShow?: boolean;
  isPaid?: boolean;
  startDate?: string;       // ISO date string
  endDate?: string;         // ISO date string
  minAmount?: number;
  maxAmount?: number;
}

export interface MarkPaidInput {
  paidAt?: Date;
}
