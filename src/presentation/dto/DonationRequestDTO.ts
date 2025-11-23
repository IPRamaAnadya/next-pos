/**
 * Presentation Layer: Donation Request DTOs
 * Validation schemas for donation API requests
 */

import * as yup from "yup";

/**
 * Create Donation Request Schema
 */
export const createDonationSchema = yup.object({
  payment_method_id: yup
    .string()
    .uuid("Invalid payment method ID format")
    .required("Payment method ID is required"),
  amount: yup
    .number()
    .positive("Amount must be positive")
    .min(1000, "Minimum donation amount is Rp 1,000")
    .required("Amount is required"),
  message: yup.string().max(500, "Message must not exceed 500 characters").optional(),
});

export type CreateDonationRequest = yup.InferType<typeof createDonationSchema>;

/**
 * Monthly Summary Query Schema
 */
export const monthlySummaryQuerySchema = yup.object({
  year: yup
    .number()
    .integer("Year must be an integer")
    .min(2020, "Year must be 2020 or later")
    .max(2100, "Year must be 2100 or earlier")
    .required("Year is required"),
  month: yup
    .number()
    .integer("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12")
    .required("Month is required"),
});

export type MonthlySummaryQuery = yup.InferType<typeof monthlySummaryQuerySchema>;

/**
 * List Donations Query Schema
 */
export const listDonationsQuerySchema = yup.object({
  page: yup
    .number()
    .integer("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: yup
    .number()
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(10),
  status: yup
    .string()
    .oneOf(["PENDING", "PAID", "FAILED", "EXPIRED"], "Invalid status")
    .optional(),
});

export type ListDonationsQuery = yup.InferType<typeof listDonationsQuerySchema>;

/**
 * Admin List Donations Query Schema (with additional filters)
 */
export const adminListDonationsQuerySchema = yup.object({
  page: yup
    .number()
    .integer("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: yup
    .number()
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(20),
  tenant_id: yup.string().uuid("Invalid tenant ID format").optional(),
  status: yup
    .string()
    .oneOf(["PENDING", "PAID", "FAILED", "EXPIRED"], "Invalid status")
    .optional(),
  payment_method_id: yup.string().uuid("Invalid payment method ID format").optional(),
  start_date: yup.string().datetime("Invalid start date format").optional(),
  end_date: yup.string().datetime("Invalid end date format").optional(),
});

export type AdminListDonationsQuery = yup.InferType<typeof adminListDonationsQuerySchema>;

/**
 * Statistics Query Schema
 */
export const statisticsQuerySchema = yup.object({
  start_date: yup.string().datetime("Invalid start date format").optional(),
  end_date: yup.string().datetime("Invalid end date format").optional(),
});

export type StatisticsQuery = yup.InferType<typeof statisticsQuerySchema>;

/**
 * Create Payment Method Request Schema (Admin)
 */
export const createPaymentMethodSchema = yup.object({
  name: yup
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),
  code: yup
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must not exceed 50 characters")
    .matches(/^[a-z0-9_]+$/, "Code must contain only lowercase letters, numbers, and underscores")
    .required("Code is required"),
  type: yup
    .string()
    .oneOf(["bank_transfer", "ewallet", "qris"], "Invalid payment type")
    .required("Type is required"),
  transaction_fee: yup
    .number()
    .min(0, "Transaction fee must be non-negative")
    .required("Transaction fee is required"),
  fee_percentage: yup.number().min(0, "Fee percentage must be non-negative").max(100, "Fee percentage must not exceed 100").optional(),
  tax_percentage: yup.number().min(0, "Tax percentage must be non-negative").max(100, "Tax percentage must not exceed 100").optional(),
  min_amount: yup
    .number()
    .positive("Minimum amount must be positive")
    .required("Minimum amount is required"),
  max_amount: yup.number().positive("Maximum amount must be positive").optional(),
  icon_url: yup.string().url("Invalid URL format").optional(),
  description: yup.string().max(500, "Description must not exceed 500 characters").optional(),
  display_order: yup.number().integer("Display order must be an integer").min(0, "Display order must be non-negative").optional(),
});

export type CreatePaymentMethodRequest = yup.InferType<typeof createPaymentMethodSchema>;

/**
 * Update Payment Method Request Schema (Admin)
 */
export const updatePaymentMethodSchema = yup.object({
  name: yup
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  transaction_fee: yup.number().min(0, "Transaction fee must be non-negative").optional(),
  fee_percentage: yup.number().min(0, "Fee percentage must be non-negative").max(100, "Fee percentage must not exceed 100").optional(),
  tax_percentage: yup.number().min(0, "Tax percentage must be non-negative").max(100, "Tax percentage must not exceed 100").optional(),
  min_amount: yup.number().positive("Minimum amount must be positive").optional(),
  max_amount: yup.number().positive("Maximum amount must be positive").optional(),
  is_active: yup.boolean().optional(),
  icon_url: yup.string().url("Invalid URL format").optional(),
  description: yup.string().max(500, "Description must not exceed 500 characters").optional(),
  display_order: yup.number().integer("Display order must be an integer").min(0, "Display order must be non-negative").optional(),
});

export type UpdatePaymentMethodRequest = yup.InferType<typeof updatePaymentMethodSchema>;
