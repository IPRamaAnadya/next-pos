import * as yup from 'yup';

export const createDiscountSchema = yup.object({
  code: yup.string().optional().nullable(),
  name: yup.string().required('Name is required').min(1, 'Name cannot be empty'),
  description: yup.string().optional().nullable(),
  type: yup.string().required('Type is required').oneOf(['percentage', 'fixed_amount', 'fixed'], 'Invalid discount type'),
  value: yup.number().required('Value is required').min(0.01, 'Value must be greater than 0'),
  valid_from: yup.date().optional().nullable(),
  valid_to: yup.date().optional().nullable(),
  min_purchase: yup.number().optional().min(0, 'Minimum purchase cannot be negative').nullable(),
  max_discount: yup.number().optional().min(0, 'Maximum discount cannot be negative').nullable(),
  applicable_items: yup.mixed().optional().nullable(),
  reward_type: yup.string().optional().nullable(),
  is_member_only: yup.boolean().optional().default(false),
});

export const updateDiscountSchema = yup.object({
  code: yup.string().optional().nullable(),
  name: yup.string().optional().min(1, 'Name cannot be empty'),
  description: yup.string().optional().nullable(),
  type: yup.string().optional().oneOf(['percentage', 'fixed_amount', 'fixed'], 'Invalid discount type'),
  value: yup.number().optional().min(0.01, 'Value must be greater than 0'),
  valid_from: yup.date().optional().nullable(),
  valid_to: yup.date().optional().nullable(),
  min_purchase: yup.number().optional().min(0, 'Minimum purchase cannot be negative').nullable(),
  max_discount: yup.number().optional().min(0, 'Maximum discount cannot be negative').nullable(),
  applicable_items: yup.mixed().optional().nullable(),
  reward_type: yup.string().optional().nullable(),
  is_member_only: yup.boolean().optional(),
});

export const discountQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_name: yup.string().optional(),
  p_code: yup.string().optional(),
  p_type: yup.string().optional(),
  p_is_active: yup.boolean().optional(),
  p_is_member_only: yup.boolean().optional(),
  p_reward_type: yup.string().optional(),
});

export const validateDiscountSchema = yup.object({
  discount_id: yup.string().required('Discount ID is required'),
  order_amount: yup.number().required('Order amount is required').min(0, 'Order amount cannot be negative'),
  is_member_customer: yup.boolean().optional().default(false),
});

export type CreateDiscountRequest = yup.InferType<typeof createDiscountSchema>;
export type UpdateDiscountRequest = yup.InferType<typeof updateDiscountSchema>;
export type DiscountQueryRequest = yup.InferType<typeof discountQuerySchema>;
export type ValidateDiscountRequest = yup.InferType<typeof validateDiscountSchema>;