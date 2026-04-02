import * as yup from 'yup';

export const createStaffSchema = yup.object({
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters long').max(50, 'Username cannot exceed 50 characters').matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters long').max(100, 'Password cannot exceed 100 characters'),
  role: yup.string().required('Role is required').oneOf(['MANAGER', 'CASHIER'], 'Role must be MANAGER or CASHIER'),
  is_owner: yup.boolean().optional().default(false),
});

export const updateStaffSchema = yup.object({
  username: yup.string().optional().min(3, 'Username must be at least 3 characters long').max(50, 'Username cannot exceed 50 characters').matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: yup.string().optional().min(6, 'Password must be at least 6 characters long').max(100, 'Password cannot exceed 100 characters'),
  role: yup.string().optional().oneOf(['MANAGER', 'CASHIER'], 'Role must be MANAGER or CASHIER'),
});

export const staffQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  p_page: yup.number().optional().min(1, 'Page must be at least 1').default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc'], 'Sort direction must be asc or desc').default('desc'),
  p_search: yup.string().optional(),
  p_role: yup.string().optional().oneOf(['MANAGER', 'CASHIER'], 'Role must be MANAGER or CASHIER'),
  p_is_owner: yup.boolean().optional(),
  p_include_owner: yup.boolean().optional().default(true),
});

export const createSalarySchema = yup.object({
  basic_salary: yup.number().required('Basic salary is required').min(0, 'Basic salary cannot be negative').max(999999999, 'Basic salary exceeds maximum allowed value'),
  fixed_allowance: yup.number().optional().min(0, 'Fixed allowance cannot be negative').max(999999999, 'Fixed allowance exceeds maximum allowed value').default(0),
  type: yup.string().optional().oneOf(['MONTHLY', 'HOURLY'], 'Salary type must be MONTHLY or HOURLY').default('MONTHLY'),
});

export const updateSalarySchema = yup.object({
  basic_salary: yup.number().optional().min(0, 'Basic salary cannot be negative').max(999999999, 'Basic salary exceeds maximum allowed value'),
  fixed_allowance: yup.number().optional().min(0, 'Fixed allowance cannot be negative').max(999999999, 'Fixed allowance exceeds maximum allowed value'),
  type: yup.string().optional().oneOf(['MONTHLY', 'HOURLY'], 'Salary type must be MONTHLY or HOURLY'),
});

export const checkInSchema = yup.object({
  check_in_time: yup.string().required('Check-in time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format'),
  date: yup.date().optional(),
});

export const checkOutSchema = yup.object({
  check_out_time: yup.string().required('Check-out time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format'),
  date: yup.date().optional(),
});

export const attendanceQuerySchema = yup.object({
  start_date: yup.date().optional(),
  end_date: yup.date().optional(),
  staff_id: yup.string().uuid('Invalid staff ID format').optional(),
});

export type CreateStaffRequest = yup.InferType<typeof createStaffSchema>;
export type UpdateStaffRequest = yup.InferType<typeof updateStaffSchema>;
export type StaffQueryRequest = yup.InferType<typeof staffQuerySchema>;
export type CreateSalaryRequest = yup.InferType<typeof createSalarySchema>;
export type UpdateSalaryRequest = yup.InferType<typeof updateSalarySchema>;
export type CheckInRequest = yup.InferType<typeof checkInSchema>;
export type CheckOutRequest = yup.InferType<typeof checkOutSchema>;
export type AttendanceQueryRequest = yup.InferType<typeof attendanceQuerySchema>;