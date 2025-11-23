import * as yup from 'yup';

export const createCategorySchema = yup.object({
  name: yup.string().required('Category name is required').min(1, 'Category name cannot be empty').max(255, 'Category name cannot exceed 255 characters'),
  description: yup.string().optional().nullable().max(1000, 'Category description cannot exceed 1000 characters'),
  parent_id: yup.string().optional().nullable().uuid('Parent ID must be a valid UUID'),
});

export const updateCategorySchema = yup.object({
  name: yup.string().optional().min(1, 'Category name cannot be empty').max(255, 'Category name cannot exceed 255 characters'),
  description: yup.string().optional().nullable().max(1000, 'Category description cannot exceed 1000 characters'),
  parent_id: yup.string().optional().nullable().uuid('Parent ID must be a valid UUID'),
});

export const categoryQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('name'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('asc'),
  p_search_name: yup.string().optional(),
  p_parent_id: yup.string().optional().nullable().uuid(),
  p_root_only: yup.boolean().optional(),
});

export const moveCategorySchema = yup.object({
  new_parent_id: yup.string().optional().nullable().uuid('New parent ID must be a valid UUID'),
});

export type CreateCategoryRequest = yup.InferType<typeof createCategorySchema>;
export type UpdateCategoryRequest = yup.InferType<typeof updateCategorySchema>;
export type CategoryQueryRequest = yup.InferType<typeof categoryQuerySchema>;
export type MoveCategoryRequest = yup.InferType<typeof moveCategorySchema>;