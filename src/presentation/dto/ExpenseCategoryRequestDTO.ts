import * as yup from 'yup';

export const createExpenseCategorySchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  code: yup.string().required('Code is required').min(2, 'Code must be at least 2 characters long').max(10, 'Code cannot exceed 10 characters').matches(/^[A-Z0-9_]+$/i, 'Code can only contain letters, numbers, and underscores'),
  is_private: yup.boolean().optional().default(false),
});

export const updateExpenseCategorySchema = yup.object({
  name: yup.string().optional().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  code: yup.string().optional().min(2, 'Code must be at least 2 characters long').max(10, 'Code cannot exceed 10 characters').matches(/^[A-Z0-9_]+$/i, 'Code can only contain letters, numbers, and underscores'),
  is_private: yup.boolean().optional(),
});

export const expenseCategoryQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  p_page: yup.number().optional().min(1, 'Page must be at least 1').default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc'], 'Sort direction must be asc or desc').default('desc'),
  p_search: yup.string().optional(),
  p_code: yup.string().optional(),
  p_is_private: yup.boolean().optional(),
  is_cashier: yup.boolean().optional().default(false),
});

export const validateCodeSchema = yup.object({
  code: yup.string().required('Code is required').min(2, 'Code must be at least 2 characters long').max(10, 'Code cannot exceed 10 characters').matches(/^[A-Z0-9_]+$/i, 'Code can only contain letters, numbers, and underscores'),
});

export type CreateExpenseCategoryRequest = yup.InferType<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryRequest = yup.InferType<typeof updateExpenseCategorySchema>;
export type ExpenseCategoryQueryRequest = yup.InferType<typeof expenseCategoryQuerySchema>;
export type ValidateCodeRequest = yup.InferType<typeof validateCodeSchema>;