import * as yup from 'yup';

export const createTenantSchema = yup.object({
  userId: yup.string().required('User ID is required'),
  name: yup.string().required('Tenant name is required').min(1, 'Tenant name cannot be empty').max(255, 'Tenant name is too long'),
  email: yup.string().required('Email is required').email('Invalid email format').max(255, 'Email is too long'),
  address: yup.string().optional().nullable().max(500, 'Address is too long'),
  phone: yup.string().optional().nullable().when([], {
    is: (value: any) => value != null && value !== '',
    then: (schema) => schema.min(10, 'Phone number must be at least 10 characters'),
    otherwise: (schema) => schema
  }),
  subscribedUntil: yup.date().optional().nullable().when([], {
    is: (value: any) => value != null,
    then: (schema) => schema.min(new Date(), 'Subscription end date cannot be in the past'),
    otherwise: (schema) => schema
  }),
  isSubscribed: yup.boolean().optional().default(false),
});

export const updateTenantSchema = yup.object({
  name: yup.string().optional().min(1, 'Name cannot be empty').max(255, 'Name is too long'),
  email: yup.string().optional().email('Invalid email format').max(255, 'Email is too long'),
  address: yup.string().optional().nullable().max(500, 'Address is too long'),
  phone: yup.string().optional().nullable().min(10, 'Phone number must be at least 10 characters'),
  subscribedUntil: yup.date().optional().nullable().min(new Date(), 'Subscription end date cannot be in the past'),
  isSubscribed: yup.boolean().optional(),
});

export const tenantQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_name: yup.string().optional(),
  p_email: yup.string().optional(),
  p_user_id: yup.string().optional(),
  p_is_subscribed: yup.boolean().optional(),
  p_subscription_status: yup.string().optional().oneOf(['active', 'expired', 'inactive']),
  p_expiring_soon: yup.number().optional().min(1).max(90),
});

export const tenantIdSchema = yup.object({
  tenantId: yup.string().required('Tenant ID is required'),
});

export const userIdSchema = yup.object({
  userId: yup.string().required('User ID is required'),
});

export const extendTrialSchema = yup.object({
  days: yup.number().optional().min(1).max(90).default(14),
});

export type CreateTenantRequest = yup.InferType<typeof createTenantSchema>;
export type UpdateTenantRequest = yup.InferType<typeof updateTenantSchema>;
export type TenantQueryRequest = yup.InferType<typeof tenantQuerySchema>;
export type TenantIdRequest = yup.InferType<typeof tenantIdSchema>;
export type UserIdRequest = yup.InferType<typeof userIdSchema>;
export type ExtendTrialRequest = yup.InferType<typeof extendTrialSchema>;