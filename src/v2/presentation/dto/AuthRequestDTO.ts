import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  tenantName: yup.string().required('Tenant name is required').min(1, 'Tenant name cannot be empty'),
  tenantAddress: yup.string().optional(),
  tenantPhone: yup.string().optional().min(10, 'Phone number must be at least 10 characters'),
});

export const cashierLoginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  tenantId: yup.string().optional(),
});

export const tenantLoginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  tenantId: yup.string().uuid('Invalid tenant ID format').required('Tenant ID is required'),
});

export const googleLoginSchema = yup.object({
  idToken: yup.string().required('Google ID token is required'),
  tenantName: yup.string().optional().min(1, 'Tenant name cannot be empty'),
  tenantAddress: yup.string().optional(),
  tenantPhone: yup.string().optional().min(10, 'Phone number must be at least 10 characters'),
});

export const validateTokenSchema = yup.object({
  token: yup.string().required('Token is required'),
});

export type LoginRequest = yup.InferType<typeof loginSchema>;
export type SignupRequest = yup.InferType<typeof signupSchema>;
export type CashierLoginRequest = yup.InferType<typeof cashierLoginSchema>;
export type TenantLoginRequest = yup.InferType<typeof tenantLoginSchema>;
export type GoogleLoginRequest = yup.InferType<typeof googleLoginSchema>;
export type ValidateTokenRequest = yup.InferType<typeof validateTokenSchema>;