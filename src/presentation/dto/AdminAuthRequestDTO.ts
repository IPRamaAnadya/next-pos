import * as yup from 'yup';

/**
 * Admin Login Request Schema
 * Supports both username and email as identifier
 */
export const adminLoginSchema = yup.object({
  identifier: yup.string()
    .required('Username or email is required')
    .min(3, 'Identifier must be at least 3 characters'),
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Admin Registration Schema
 * Used for creating the first admin account
 */
export const adminRegistrationSchema = yup.object({
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
  fullName: yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
});

/**
 * Type exports for request handling
 */
export type AdminLoginRequest = yup.InferType<typeof adminLoginSchema>;
export type AdminRegistrationRequest = yup.InferType<typeof adminRegistrationSchema>;
