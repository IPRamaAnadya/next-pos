/**
 * Presentation Layer: Customer Messaging Response DTOs
 * Response formatters for messaging API
 */

import { MessageTemplate } from "@/domain/entities/MessageTemplate";
import { MessagingConfig } from "@/domain/entities/MessagingConfig";
import { MessageLog } from "@/domain/entities/MessageLog";

/**
 * Format MessageTemplate for API response
 */
export interface MessageTemplateResponse {
  id: string;
  tenant_id: string;
  name: string;
  event: string;
  message: string;
  is_custom: boolean;
  required_variables: string[];
  created_at: string;
  updated_at: string;
}

export function toMessageTemplateResponse(template: MessageTemplate): MessageTemplateResponse {
  return {
    id: template.id,
    tenant_id: template.tenantId,
    name: template.name,
    event: template.event,
    message: template.message,
    is_custom: template.isCustom,
    required_variables: template.getRequiredVariables(),
    created_at: template.createdAt.toISOString(),
    updated_at: template.updatedAt.toISOString(),
  };
}

/**
 * Format MessagingConfig for API response
 */
export interface MessagingConfigResponse {
  id: string;
  tenant_id: string;
  provider: string;
  provider_name: string;
  config: {
    api_url?: string;
    sender_id?: string;
    [key: string]: string | undefined;
  };
  is_active: boolean;
  is_ready: boolean;
  validation_errors: string[];
  created_at: string;
  updated_at: string;
}

export function toMessagingConfigResponse(config: MessagingConfig): MessagingConfigResponse {
  const validation = config.validateConfig();
  const maskedConfig = config.getMaskedConfig();

  return {
    id: config.id,
    tenant_id: config.tenantId,
    provider: config.provider,
    provider_name: config.getProviderName(),
    config: maskedConfig,
    is_active: config.isActive,
    is_ready: config.isReady(),
    validation_errors: validation.errors,
    created_at: config.createdAt.toISOString(),
    updated_at: config.updatedAt.toISOString(),
  };
}

/**
 * Format MessageLog for API response
 */
export interface MessageLogResponse {
  id: string;
  tenant_id: string;
  config_id: string;
  template_id?: string;
  recipient: string;
  message: string;
  status: string;
  status_display: string;
  provider_response?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  is_from_template: boolean;
  is_successful: boolean;
  created_at: string;
}

export function toMessageLogResponse(log: MessageLog): MessageLogResponse {
  return {
    id: log.id,
    tenant_id: log.tenantId,
    config_id: log.configId,
    template_id: log.templateId,
    recipient: log.recipient,
    message: log.message,
    status: log.status,
    status_display: log.getStatusDisplay(),
    provider_response: log.providerResponse,
    error_message: log.errorMessage,
    sent_at: log.sentAt?.toISOString(),
    delivered_at: log.deliveredAt?.toISOString(),
    is_from_template: log.isFromTemplate(),
    is_successful: log.isSuccessful(),
    created_at: log.createdAt.toISOString(),
  };
}

/**
 * Send Message Response
 */
export interface SendMessageResponse {
  message_log: MessageLogResponse;
  success: boolean;
}

export function toSendMessageResponse(log: MessageLog): SendMessageResponse {
  return {
    message_log: toMessageLogResponse(log),
    success: log.isSuccessful(),
  };
}

/**
 * Preview Template Response
 */
export interface PreviewTemplateResponse {
  success: boolean;
  rendered_message?: string;
  missing_variables?: string[];
}

/**
 * Available Providers Response
 */
export interface ProviderInfoResponse {
  type: string;
  name: string;
  description: string;
  status: "available" | "coming_soon";
}

/**
 * Test Connection Response
 */
export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

/**
 * Paginated Message Logs Response
 */
export interface PaginatedMessageLogsResponse {
  data: MessageLogResponse[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export function toPaginatedMessageLogsResponse(
  logs: MessageLog[],
  page: number,
  pageSize: number,
  total: number,
  totalPages: number
): PaginatedMessageLogsResponse {
  return {
    data: logs.map(toMessageLogResponse),
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    },
  };
}
