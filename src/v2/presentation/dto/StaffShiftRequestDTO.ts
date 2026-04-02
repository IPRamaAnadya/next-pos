import * as yup from 'yup';

// Create Staff Shift Schema
export const createStaffShiftSchema = yup.object({
  staffId: yup.string().required('Staff ID is required').uuid('Staff ID must be a valid UUID'),
  shiftId: yup.string().required('Shift ID is required').uuid('Shift ID must be a valid UUID'),
  date: yup.date().required('Date is required').min(new Date(new Date().setHours(0, 0, 0, 0)), 'Cannot assign shifts for past dates'),
  notes: yup.string().optional().max(500, 'Notes cannot exceed 500 characters'),
});

// Update Staff Shift Schema
export const updateStaffShiftSchema = yup.object({
  check_in_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-in time must be in HH:mm format'),
  check_out_time: yup.string().optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-out time must be in HH:mm format'),
  actual_break_duration: yup.number().optional().min(0, 'Break duration cannot be negative').max(480, 'Break duration cannot exceed 8 hours'),
  late_minutes: yup.number().optional().min(0, 'Late minutes cannot be negative'),
  overtime_minutes: yup.number().optional().min(0, 'Overtime minutes cannot be negative'),
  is_completed: yup.boolean().optional(),
  notes: yup.string().optional().max(500, 'Notes cannot exceed 500 characters'),
});

// Check-in Schema
export const checkInSchema = yup.object({
  check_in_time: yup.string().required('Check-in time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-in time must be in HH:mm format'),
});

// Check-out Schema
export const checkOutSchema = yup.object({
  check_out_time: yup.string().required('Check-out time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Check-out time must be in HH:mm format'),
  actual_break_duration: yup.number().optional().min(0, 'Break duration cannot be negative').max(480, 'Break duration cannot exceed 8 hours'),
});

// Staff Shift Query Schema
export const staffShiftQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_staff_id: yup.string().optional().uuid('Staff ID must be a valid UUID'),
  p_shift_id: yup.string().optional().uuid('Shift ID must be a valid UUID'),
  p_date: yup.date().optional(),
  p_date_from: yup.date().optional(),
  p_date_to: yup.date().optional(),
  p_is_completed: yup.boolean().optional(),
  p_has_checked_in: yup.boolean().optional(),
  p_has_checked_out: yup.boolean().optional(),
}).test('date-range', 'End date must be after start date', function(values) {
  if (values.p_date_from && values.p_date_to && values.p_date_to < values.p_date_from) {
    return this.createError({
      path: 'p_date_to',
      message: 'End date must be after start date'
    });
  }
  return true;
});

// Bulk Assignment Schema
export const bulkAssignSchema = yup.object({
  assignments: yup.array().of(
    yup.object({
      staff_id: yup.string().required('Staff ID is required').uuid('Staff ID must be a valid UUID'),
      shift_id: yup.string().required('Shift ID is required').uuid('Shift ID must be a valid UUID'),
      date: yup.date().required('Date is required').min(new Date(new Date().setHours(0, 0, 0, 0)), 'Cannot assign shifts for past dates'),
      notes: yup.string().optional().max(500, 'Notes cannot exceed 500 characters'),
    })
  ).required('Assignments array is required').min(1, 'At least one assignment is required').max(100, 'Cannot assign more than 100 shifts at once'),
});

export type CreateStaffShiftRequest = yup.InferType<typeof createStaffShiftSchema>;
export type UpdateStaffShiftRequest = yup.InferType<typeof updateStaffShiftSchema>;
export type CheckInRequest = yup.InferType<typeof checkInSchema>;
export type CheckOutRequest = yup.InferType<typeof checkOutSchema>;
export type StaffShiftQueryRequest = yup.InferType<typeof staffShiftQuerySchema>;
export type BulkAssignRequest = yup.InferType<typeof bulkAssignSchema>;