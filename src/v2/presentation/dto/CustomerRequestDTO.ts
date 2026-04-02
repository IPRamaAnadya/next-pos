import * as yup from 'yup';

export const createCustomerSchema = yup.object({
  membership_code: yup.string().optional().nullable(),
  name: yup.string().required('Name is required').min(1, 'Name cannot be empty'),
  email: yup.string().optional().email('Invalid email format').nullable(),
  phone: yup.string().optional().nullable(),
  address: yup.string().optional().nullable(),
  birthday: yup.date().optional().nullable(),
  membership_expired_at: yup.date().optional().nullable(),
  points: yup.number().optional().min(0, 'Points cannot be negative').default(0),
});

export const updateCustomerSchema = yup.object({
  membership_code: yup.string().optional().nullable(),
  name: yup.string().optional().min(1, 'Name cannot be empty'),
  email: yup.string().optional().email('Invalid email format').nullable(),
  phone: yup.string().optional().nullable(),
  address: yup.string().optional().nullable(),
  birthday: yup.date().optional().nullable(),
  last_purchase_at: yup.date().optional().nullable(),
  membership_expired_at: yup.date().optional().nullable(),
  points: yup.number().optional().min(0, 'Points cannot be negative'),
});

export const customerQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_search: yup.string().optional(),
  p_name: yup.string().optional(),
  p_email: yup.string().optional(),
  p_phone: yup.string().optional(),
  p_membership_code: yup.string().optional(),
  p_has_active_membership: yup.boolean().optional(),
});

export type CreateCustomerRequest = yup.InferType<typeof createCustomerSchema>;
export type UpdateCustomerRequest = yup.InferType<typeof updateCustomerSchema>;
export type CustomerQueryRequest = yup.InferType<typeof customerQuerySchema>;