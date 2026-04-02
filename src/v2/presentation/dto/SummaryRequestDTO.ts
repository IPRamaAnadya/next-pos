/**
 * Presentation: Summary Request DTOs
 * Validation schemas for summary requests
 */

import * as yup from 'yup';

/**
 * Schema for date range queries
 * Accepts ISO UTC datetime strings
 */
export const summaryDateRangeSchema = yup.object({
  startDate: yup
    .string()
    .required('Start date is required')
    .test('is-iso-date', 'Start date must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  endDate: yup
    .string()
    .required('End date is required')
    .test('is-iso-date', 'End date must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
});

/**
 * Schema for today queries (no parameters needed, but included for consistency)
 */
export const todayQuerySchema = yup.object({
  todayStart: yup
    .string()
    .required('Today start is required')
    .test('is-iso-date', 'Today start must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  todayEnd: yup
    .string()
    .required('Today end is required')
    .test('is-iso-date', 'Today end must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
});

/**
 * Schema for top customers query with optional limit
 */
export const topCustomerQuerySchema = yup.object({
  startDate: yup
    .string()
    .required('Start date is required')
    .test('is-iso-date', 'Start date must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  endDate: yup
    .string()
    .required('End date is required')
    .test('is-iso-date', 'End date must be a valid ISO UTC datetime', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  limit: yup
    .number()
    .optional()
    .positive('Limit must be positive')
    .integer('Limit must be an integer')
    .default(20),
});

/**
 * TypeScript types for validated requests
 */
export type SummaryDateRangeRequest = yup.InferType<typeof summaryDateRangeSchema>;
export type TodayQueryRequest = yup.InferType<typeof todayQuerySchema>;
export type TopCustomerQueryRequest = yup.InferType<typeof topCustomerQuerySchema>;
