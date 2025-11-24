/**
 * Report Request DTOs
 * Validation schemas for report requests
 */

import * as yup from 'yup';

export const generateReportSchema = yup.object({
  type: yup
    .string()
    .required('Report type is required')
    .oneOf(['SALES', 'PROFIT_LOSS'], 'Invalid report type. Must be SALES or PROFIT_LOSS'),
  start_date: yup
    .date()
    .required('Start date is required')
    .test('is-utc', 'Start date must be a valid UTC date', (value) => {
      return value instanceof Date && !isNaN(value.getTime());
    }),
  end_date: yup
    .date()
    .required('End date is required')
    .test('is-utc', 'End date must be a valid UTC date', (value) => {
      return value instanceof Date && !isNaN(value.getTime());
    })
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { start_date } = this.parent;
      return !start_date || !value || value > start_date;
    }),
});

export const reportQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_type: yup.string().optional().oneOf(['SALES', 'PROFIT_LOSS']),
  p_status: yup.string().optional().oneOf(['PENDING', 'GENERATED', 'FAILED']),
  p_start_date: yup.date().optional(),
  p_end_date: yup.date().optional(),
});

export type GenerateReportRequest = yup.InferType<typeof generateReportSchema>;
export type ReportQueryRequest = yup.InferType<typeof reportQuerySchema>;
