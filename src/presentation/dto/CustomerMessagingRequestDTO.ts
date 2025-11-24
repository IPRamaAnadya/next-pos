/**
 * Presentation Layer: Customer Messaging Request DTOs
 * Validation schemas for messaging API requests
 */

import * as yup from "yup";

/**
 * Send Message Request Schema
 */
export const sendMessageSchema = yup.object({
  provider: yup
    .string()
    .oneOf(["fonnte", "twilio", "sendgrid", "custom"], "Invalid provider")
    .required("Provider is required"),
  recipient: yup
    .string()
    .required("Recipient is required")
    .min(5, "Recipient must be at least 5 characters"),
  message: yup
    .string()
    .required("Message is required")
    .min(1, "Message cannot be empty")
    .max(5000, "Message must not exceed 5000 characters"),
});

export type SendMessageRequest = yup.InferType<typeof sendMessageSchema>;

/**
 * Send Message with Template Request Schema
 */
export const sendMessageWithTemplateSchema = yup.object({
  provider: yup
    .string()
    .oneOf(["fonnte", "twilio", "sendgrid", "custom"], "Invalid provider")
    .required("Provider is required"),
  template_id: yup
    .string()
    .uuid("Invalid template ID format")
    .required("Template ID is required"),
  recipient: yup
    .string()
    .required("Recipient is required")
    .min(5, "Recipient must be at least 5 characters"),
  variables: yup
    .object()
    .test("is-object", "Variables must be an object", (value) => {
      return typeof value === "object" && value !== null && !Array.isArray(value);
    })
    .required("Variables are required"),
});

export type SendMessageWithTemplateRequest = yup.InferType<typeof sendMessageWithTemplateSchema>;

/**
 * Create Message Template Request Schema
 */
export const createMessageTemplateSchema = yup.object({
  name: yup
    .string()
    .required("Template name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  event: yup
    .string()
    .oneOf(
      ["ORDER_CREATED", "ORDER_PAID", "ORDER_COMPLETED", "ORDER_CANCELLED", "PAYMENT_REMINDER", "CUSTOM", "ORDER_UPDATED"],
      "Invalid event"
    )
    .required("Event is required"),
  message: yup
    .string()
    .required("Message is required")
    .min(1, "Message cannot be empty")
    .max(5000, "Message must not exceed 5000 characters"),
  is_custom: yup.boolean().optional().default(true),
});

export type CreateMessageTemplateRequest = yup.InferType<typeof createMessageTemplateSchema>;

/**
 * Update Message Template Request Schema
 */
export const updateMessageTemplateSchema = yup.object({
  name: yup
    .string()
    .optional()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  message: yup
    .string()
    .optional()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must not exceed 5000 characters"),
});

export type UpdateMessageTemplateRequest = yup.InferType<typeof updateMessageTemplateSchema>;

/**
 * Preview Message Template Request Schema
 */
export const previewMessageTemplateSchema = yup.object({
  variables: yup
    .object()
    .test("is-object", "Variables must be an object", (value) => {
      return typeof value === "object" && value !== null && !Array.isArray(value);
    })
    .required("Variables are required"),
});

export type PreviewMessageTemplateRequest = yup.InferType<typeof previewMessageTemplateSchema>;

/**
 * Create Messaging Config Request Schema
 */
export const createMessagingConfigSchema = yup.object({
  provider: yup
    .string()
    .oneOf(["fonnte", "twilio", "sendgrid", "custom"], "Invalid provider")
    .required("Provider is required"),
  config: yup
    .object()
    .shape({
      api_token: yup.string().optional(),
      api_url: yup.string().url("Invalid API URL").optional(),
      sender_id: yup.string().optional(),
      account_sid: yup.string().optional(),
      auth_token: yup.string().optional(),
      api_key: yup.string().optional(),
    })
    .required("Configuration is required"),
  is_active: yup.boolean().optional().default(true),
});

export type CreateMessagingConfigRequest = yup.InferType<typeof createMessagingConfigSchema>;

/**
 * Update Messaging Config Request Schema
 */
export const updateMessagingConfigSchema = yup.object({
  config: yup
    .object()
    .shape({
      api_token: yup.string().optional(),
      api_url: yup.string().url("Invalid API URL").optional(),
      sender_id: yup.string().optional(),
      account_sid: yup.string().optional(),
      auth_token: yup.string().optional(),
      api_key: yup.string().optional(),
    })
    .optional(),
  is_active: yup.boolean().optional(),
});

export type UpdateMessagingConfigRequest = yup.InferType<typeof updateMessagingConfigSchema>;

/**
 * Get Message Logs Query Schema
 */
export const getMessageLogsQuerySchema = yup.object({
  page: yup
    .number()
    .integer("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  page_size: yup
    .number()
    .integer("Page size must be an integer")
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must not exceed 100")
    .optional()
    .default(10),
  config_id: yup.string().uuid("Invalid config ID format").optional(),
  template_id: yup.string().uuid("Invalid template ID format").optional(),
  status: yup
    .string()
    .oneOf(["pending", "sent", "failed", "delivered"], "Invalid status")
    .optional(),
  recipient: yup.string().optional(),
  start_date: yup.string().datetime("Invalid start date format").optional(),
  end_date: yup.string().datetime("Invalid end date format").optional(),
});

export type GetMessageLogsQuery = yup.InferType<typeof getMessageLogsQuerySchema>;
