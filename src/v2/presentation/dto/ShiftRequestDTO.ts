import * as yup from 'yup';

// Create Shift Schema
export const createShiftSchema = yup.object({
  name: yup.string().required('Shift name is required').min(1, 'Shift name cannot be empty').max(100, 'Shift name cannot exceed 100 characters'),
  start_time: yup.string().required('Start time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'),
  end_time: yup.string().required('End time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'),
  calculate_before_start_time: yup.boolean().optional().default(true),
  has_break_time: yup.boolean().optional().default(false),
  break_duration: yup.number().optional().min(0, 'Break duration cannot be negative').max(480, 'Break duration cannot exceed 8 hours').default(0),
  min_working_hours: yup.number().optional().min(0.5, 'Minimum working hours must be at least 0.5').max(24, 'Minimum working hours cannot exceed 24').default(8),
  max_working_hours: yup.number().optional().min(0.5, 'Maximum working hours must be at least 0.5').max(24, 'Maximum working hours cannot exceed 24').default(8),
  overtime_multiplier: yup.number().optional().min(1, 'Overtime multiplier must be at least 1').max(5, 'Overtime multiplier cannot exceed 5').default(1.5),
  late_threshold: yup.number().optional().min(0, 'Late threshold cannot be negative').max(120, 'Late threshold cannot exceed 2 hours').default(15),
  early_checkin_allowed: yup.number().optional().min(0, 'Early check-in time cannot be negative').max(240, 'Early check-in time cannot exceed 4 hours').default(30),
  color: yup.string().optional().matches(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').default('#3B82F6'),
  description: yup.string().optional().max(500, 'Description cannot exceed 500 characters'),
}).test('working-hours', 'Maximum working hours must be greater than or equal to minimum working hours', function(values) {
  if (values.max_working_hours && values.min_working_hours && values.max_working_hours < values.min_working_hours) {
    return this.createError({
      path: 'max_working_hours',
      message: 'Maximum working hours must be greater than or equal to minimum working hours'
    });
  }
  return true;
});

// Update Shift Schema
export const updateShiftSchema = yup.object({
  name: yup.string().optional().min(1, 'Shift name cannot be empty').max(100, 'Shift name cannot exceed 100 characters'),
  start_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'),
  end_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'),
  is_active: yup.boolean().optional(),
  calculate_before_start_time: yup.boolean().optional(),
  has_break_time: yup.boolean().optional(),
  break_duration: yup.number().optional().min(0, 'Break duration cannot be negative').max(480, 'Break duration cannot exceed 8 hours'),
  min_working_hours: yup.number().optional().min(0.5, 'Minimum working hours must be at least 0.5').max(24, 'Minimum working hours cannot exceed 24'),
  max_working_hours: yup.number().optional().min(0.5, 'Maximum working hours must be at least 0.5').max(24, 'Maximum working hours cannot exceed 24'),
  overtime_multiplier: yup.number().optional().min(1, 'Overtime multiplier must be at least 1').max(5, 'Overtime multiplier cannot exceed 5'),
  late_threshold: yup.number().optional().min(0, 'Late threshold cannot be negative').max(120, 'Late threshold cannot exceed 2 hours'),
  early_checkin_allowed: yup.number().optional().min(0, 'Early check-in time cannot be negative').max(240, 'Early check-in time cannot exceed 4 hours'),
  color: yup.string().optional().matches(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  description: yup.string().optional().max(500, 'Description cannot exceed 500 characters'),
}).test('working-hours', 'Maximum working hours must be greater than or equal to minimum working hours', function(values) {
  if (values.max_working_hours && values.min_working_hours && values.max_working_hours < values.min_working_hours) {
    return this.createError({
      path: 'max_working_hours',
      message: 'Maximum working hours must be greater than or equal to minimum working hours'
    });
  }
  return true;
});

// Shift Query Schema
export const shiftQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_name: yup.string().optional(),
  p_is_active: yup.boolean().optional(),
  p_start_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'),
  p_end_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'),
});

// Toggle Active Schema
export const toggleActiveSchema = yup.object({
  is_active: yup.boolean().required('Active status is required'),
});

export type CreateShiftRequest = yup.InferType<typeof createShiftSchema>;
export type UpdateShiftRequest = yup.InferType<typeof updateShiftSchema>;
export type ShiftQueryRequest = yup.InferType<typeof shiftQuerySchema>;
export type ToggleActiveRequest = yup.InferType<typeof toggleActiveSchema>;