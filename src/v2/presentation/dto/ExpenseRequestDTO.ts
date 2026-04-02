import * as yup from 'yup';

export const createExpenseSchema = yup.object({
  expense_category_id: yup.string().uuid('Invalid expense category ID format').required('Expense category ID is required'),
  staff_id: yup.string().uuid('Invalid staff ID format').required('Staff ID is required'),
  description: yup.string().required('Description is required').min(3, 'Description must be at least 3 characters long').max(500, 'Description cannot exceed 500 characters'),
  amount: yup.number().required('Amount is required').min(0.01, 'Amount must be greater than 0').max(1000000000, 'Amount exceeds maximum limit'),
  payment_type: yup.string().optional().oneOf(['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'E-Wallet'], 'Invalid payment type').default('Cash'),
  is_show: yup.boolean().optional().default(true),
  paid_at: yup.date().optional().nullable(),
  attachment_url: yup.string().optional().url('Invalid URL format').nullable(),
  payroll_detail_id: yup.string().uuid('Invalid payroll detail ID format').optional().nullable(),
});

export const updateExpenseSchema = yup.object({
  expense_category_id: yup.string().uuid('Invalid expense category ID format').optional(),
  staff_id: yup.string().uuid('Invalid staff ID format').optional(),
  description: yup.string().optional().min(3, 'Description must be at least 3 characters long').max(500, 'Description cannot exceed 500 characters'),
  amount: yup.number().optional().min(0.01, 'Amount must be greater than 0').max(1000000000, 'Amount exceeds maximum limit'),
  payment_type: yup.string().optional().oneOf(['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'E-Wallet'], 'Invalid payment type'),
  is_show: yup.boolean().optional(),
  paid_at: yup.date().optional().nullable(),
  attachment_url: yup.string().optional().url('Invalid URL format').nullable(),
  payroll_detail_id: yup.string().uuid('Invalid payroll detail ID format').optional().nullable(),
});

export const expenseQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  p_page: yup.number().optional().min(1, 'Page must be at least 1').default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc'], 'Sort direction must be asc or desc').default('desc'),
  p_description: yup.string().optional(),
  p_expense_category_id: yup.string().uuid('Invalid expense category ID format').optional(),
  p_staff_id: yup.string().uuid('Invalid staff ID format').optional(),
  p_payment_type: yup.string().optional().oneOf(['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'E-Wallet'], 'Invalid payment type'),
  p_is_show: yup.boolean().optional(),
  p_is_paid: yup.boolean().optional(),
  p_min_amount: yup.number().optional().min(0, 'Minimum amount cannot be negative'),
  p_max_amount: yup.number().optional().min(0, 'Maximum amount cannot be negative'),
  p_start_date: yup.date().optional(),
  p_end_date: yup.date().optional(),
  is_cashier: yup.boolean().optional().default(false),
});

export const markPaidSchema = yup.object({
  paid_at: yup.date().optional(),
});

export const dateRangeSchema = yup.object({
  start_date: yup.date().required('Start date is required'),
  end_date: yup.date().required('End date is required').min(yup.ref('start_date'), 'End date cannot be before start date'),
});

export type CreateExpenseRequest = yup.InferType<typeof createExpenseSchema>;
export type UpdateExpenseRequest = yup.InferType<typeof updateExpenseSchema>;
export type ExpenseQueryRequest = yup.InferType<typeof expenseQuerySchema>;
export type MarkPaidRequest = yup.InferType<typeof markPaidSchema>;
export type DateRangeRequest = yup.InferType<typeof dateRangeSchema>;