/**
 * Presentation Controller: Customer Messaging Controller
 * Handles HTTP requests for customer messaging operations
 */

import { NextResponse } from "next/server";
import { apiResponse } from "@/app/api/utils/response";
import { MessageStatus } from "@/domain/entities/MessageLog";
import { MessagingProvider } from "@/domain/entities/MessagingConfig";
import {
  SendMessageUseCase,
  SendMessageWithTemplateUseCase,
  GetMessageLogsUseCase,
  GetMessageLogByIdUseCase,
} from "@/application/use-cases/CustomerMessagingUseCases";
import {
  CreateMessageTemplateUseCase,
  GetMessageTemplatesUseCase,
  GetMessageTemplateByIdUseCase,
  UpdateMessageTemplateUseCase,
  DeleteMessageTemplateUseCase,
  PreviewMessageTemplateUseCase,
} from "@/application/use-cases/MessageTemplateUseCases";
import {
  CreateMessagingConfigUseCase,
  GetMessagingConfigsUseCase,
  GetMessagingConfigByIdUseCase,
  UpdateMessagingConfigUseCase,
  DeleteMessagingConfigUseCase,
  TestMessagingConfigUseCase,
  GetAvailableProvidersUseCase,
} from "@/application/use-cases/MessagingConfigUseCases";
import {
  sendMessageSchema,
  sendMessageWithTemplateSchema,
  createMessageTemplateSchema,
  updateMessageTemplateSchema,
  previewMessageTemplateSchema,
  createMessagingConfigSchema,
  updateMessagingConfigSchema,
  getMessageLogsQuerySchema,
} from "@/presentation/dto/CustomerMessagingRequestDTO";
import {
  toSendMessageResponse,
  toMessageTemplateResponse,
  toMessagingConfigResponse,
  toMessageLogResponse,
  toPaginatedMessageLogsResponse,
  PreviewTemplateResponse,
  ProviderInfoResponse,
  TestConnectionResponse,
} from "@/presentation/dto/CustomerMessagingResponseDTO";

export class CustomerMessagingController {
  constructor(
    // Messaging Use Cases
    private sendMessageUseCase: SendMessageUseCase,
    private sendMessageWithTemplateUseCase: SendMessageWithTemplateUseCase,
    private getMessageLogsUseCase: GetMessageLogsUseCase,
    private getMessageLogByIdUseCase: GetMessageLogByIdUseCase,
    // Template Use Cases
    private createMessageTemplateUseCase: CreateMessageTemplateUseCase,
    private getMessageTemplatesUseCase: GetMessageTemplatesUseCase,
    private getMessageTemplateByIdUseCase: GetMessageTemplateByIdUseCase,
    private updateMessageTemplateUseCase: UpdateMessageTemplateUseCase,
    private deleteMessageTemplateUseCase: DeleteMessageTemplateUseCase,
    private previewMessageTemplateUseCase: PreviewMessageTemplateUseCase,
    // Config Use Cases
    private createMessagingConfigUseCase: CreateMessagingConfigUseCase,
    private getMessagingConfigsUseCase: GetMessagingConfigsUseCase,
    private getMessagingConfigByIdUseCase: GetMessagingConfigByIdUseCase,
    private updateMessagingConfigUseCase: UpdateMessagingConfigUseCase,
    private deleteMessagingConfigUseCase: DeleteMessagingConfigUseCase,
    private testMessagingConfigUseCase: TestMessagingConfigUseCase,
    private getAvailableProvidersUseCase: GetAvailableProvidersUseCase
  ) {}

  // ============================================
  // MESSAGING OPERATIONS
  // ============================================

  /**
   * Send Message
   */
  async sendMessage(request: Request, tenantId: string) {
    try {
      const body = await request.json();
      const validatedData = await sendMessageSchema.validate(body, {
        abortEarly: false,
      });

      const messageLog = await this.sendMessageUseCase.execute({
        tenantId,
        provider: validatedData.provider as MessagingProvider,
        recipient: validatedData.recipient,
        message: validatedData.message,
      });

      return apiResponse.success({
        data: toSendMessageResponse(messageLog),
        message: "Message sent successfully",
      });
    } catch (error: any) {
      console.error("Send message error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("No active configuration")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      if (error.message.includes("Failed to send message")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Send Message with Template
   */
  async sendMessageWithTemplate(request: Request, tenantId: string) {
    try {
      const body = await request.json();
      const validatedData = await sendMessageWithTemplateSchema.validate(body, {
        abortEarly: false,
      });

      const messageLog = await this.sendMessageWithTemplateUseCase.execute({
        tenantId,
        provider: validatedData.provider as MessagingProvider,
        templateId: validatedData.template_id,
        recipient: validatedData.recipient,
        variables: validatedData.variables as Record<string, string | number>,
      });

      return apiResponse.success({
        data: toSendMessageResponse(messageLog),
        message: "Message sent successfully using template",
      });
    } catch (error: any) {
      console.error("Send message with template error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("Template not found")) {
        return apiResponse.notFound(error.message);
      }
      if (error.message.includes("Missing required variables")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      if (error.message.includes("No active configuration")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      if (error.message.includes("Failed to send message")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Message Logs
   */
  async getMessageLogs(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const query = {
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        page_size: searchParams.get("page_size") ? Number(searchParams.get("page_size")) : 10,
        config_id: searchParams.get("config_id") || undefined,
        template_id: searchParams.get("template_id") || undefined,
        status: searchParams.get("status") || undefined,
        recipient: searchParams.get("recipient") || undefined,
        start_date: searchParams.get("start_date") || undefined,
        end_date: searchParams.get("end_date") || undefined,
      };

      const validatedQuery = await getMessageLogsQuerySchema.validate(query, {
        abortEarly: false,
      });

      const result = await this.getMessageLogsUseCase.execute({
        tenantId,
        configId: validatedQuery.config_id,
        templateId: validatedQuery.template_id,
        status: validatedQuery.status ? (validatedQuery.status as MessageStatus) : undefined,
        recipient: validatedQuery.recipient,
        startDate: validatedQuery.start_date ? new Date(validatedQuery.start_date) : undefined,
        endDate: validatedQuery.end_date ? new Date(validatedQuery.end_date) : undefined,
        page: validatedQuery.page,
        pageSize: validatedQuery.page_size,
      });

      return apiResponse.success({
        data: result.data.map(toMessageLogResponse),
        message: "Message logs retrieved successfully",
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      });
    } catch (error: any) {
      console.error("Get message logs error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Message Log by ID
   */
  async getMessageLogById(request: Request, tenantId: string, logId: string) {
    try {
      const messageLog = await this.getMessageLogByIdUseCase.execute(
        logId,
        tenantId
      );

      return apiResponse.success({
        data: toMessageLogResponse(messageLog),
        message: "Message log retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get message log by ID error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  // ============================================
  // TEMPLATE OPERATIONS
  // ============================================

  /**
   * Create Message Template
   */
  async createMessageTemplate(request: Request, tenantId: string) {
    try {
      const body = await request.json();
      const validatedData = await createMessageTemplateSchema.validate(body, {
        abortEarly: false,
      });

      const template = await this.createMessageTemplateUseCase.execute({
        tenantId,
        name: validatedData.name,
        event: validatedData.event as any,
        message: validatedData.message,
        isCustom: validatedData.is_custom ?? true,
      });

      return apiResponse.success({
        data: toMessageTemplateResponse(template),
        message: "Template created successfully",
      });
    } catch (error: any) {
      console.error("Create template error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("already exists")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Message Templates
   */
  async getMessageTemplates(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const event = searchParams.get("event") || undefined;
      const isCustom = searchParams.get("is_custom")
        ? searchParams.get("is_custom") === "true"
        : undefined;

      const templates = await this.getMessageTemplatesUseCase.execute({
        tenantId,
        event: event as any,
        isCustom,
      });

      return apiResponse.success({
        data: templates.map(toMessageTemplateResponse),
        message: "Templates retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get templates error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Get Message Template by ID
   */
  async getMessageTemplateById(
    request: Request,
    tenantId: string,
    templateId: string
  ) {
    try {
      const template = await this.getMessageTemplateByIdUseCase.execute(
        templateId,
        tenantId
      );

      return apiResponse.success({
        data: toMessageTemplateResponse(template),
        message: "Template retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get template by ID error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Update Message Template
   */
  async updateMessageTemplate(
    request: Request,
    tenantId: string,
    templateId: string
  ) {
    try {
      const body = await request.json();
      const validatedData = await updateMessageTemplateSchema.validate(body, {
        abortEarly: false,
      });

      const template = await this.updateMessageTemplateUseCase.execute({
        id: templateId,
        tenantId,
        name: validatedData.name,
        message: validatedData.message,
      });

      return apiResponse.success({
        data: toMessageTemplateResponse(template),
        message: "Template updated successfully",
      });
    } catch (error: any) {
      console.error("Update template error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      if (error.message.includes("Cannot edit")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Delete Message Template
   */
  async deleteMessageTemplate(
    request: Request,
    tenantId: string,
    templateId: string
  ) {
    try {
      await this.deleteMessageTemplateUseCase.execute(templateId, tenantId);

      return apiResponse.success({
        data: null,
        message: "Template deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete template error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      if (error.message.includes("Cannot delete")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Preview Message Template
   */
  async previewMessageTemplate(
    request: Request,
    tenantId: string,
    templateId: string
  ) {
    try {
      const body = await request.json();
      const validatedData = await previewMessageTemplateSchema.validate(body, {
        abortEarly: false,
      });

      const preview = await this.previewMessageTemplateUseCase.execute({
        id: templateId,
        tenantId,
        variables: validatedData.variables as Record<string, string | number>,
      });

      const response: PreviewTemplateResponse = {
        success: preview.success,
        rendered_message: preview.renderedMessage,
        missing_variables: preview.missingVariables,
      };

      return apiResponse.success({
        data: response,
        message: preview.success
          ? "Template preview generated successfully"
          : "Missing required variables",
      });
    } catch (error: any) {
      console.error("Preview template error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  // ============================================
  // CONFIG OPERATIONS
  // ============================================

  /**
   * Create Messaging Config
   */
  async createMessagingConfig(request: Request, tenantId: string) {
    try {
      const body = await request.json();
      const validatedData = await createMessagingConfigSchema.validate(body, {
        abortEarly: false,
      });

      // Map snake_case to camelCase for ProviderConfig
      const config = {
        apiToken: validatedData.config.api_token,
        apiUrl: validatedData.config.api_url,
        senderId: validatedData.config.sender_id,
        accountSid: validatedData.config.account_sid,
        authToken: validatedData.config.auth_token,
        apiKey: validatedData.config.api_key,
      };

      const messagingConfig = await this.createMessagingConfigUseCase.execute({
        tenantId,
        provider: validatedData.provider as MessagingProvider,
        config,
        isActive: validatedData.is_active ?? true,
      });

      return apiResponse.success({
        data: toMessagingConfigResponse(messagingConfig),
        message: "Messaging configuration created successfully",
      });
    } catch (error: any) {
      console.error("Create messaging config error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("not supported")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      if (error.message.includes("Invalid configuration")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      if (error.message.includes("already exists")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Messaging Configs
   */
  async getMessagingConfigs(request: Request, tenantId: string) {
    try {
      const configs = await this.getMessagingConfigsUseCase.execute(tenantId);

      return apiResponse.success({
        data: configs.map(toMessagingConfigResponse),
        message: "Messaging configurations retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get messaging configs error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Get Messaging Config by ID
   */
  async getMessagingConfigById(
    request: Request,
    tenantId: string,
    configId: string
  ) {
    try {
      const config = await this.getMessagingConfigByIdUseCase.execute(
        configId,
        tenantId
      );

      return apiResponse.success({
        data: toMessagingConfigResponse(config),
        message: "Messaging configuration retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get messaging config by ID error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Update Messaging Config
   */
  async updateMessagingConfig(
    request: Request,
    tenantId: string,
    configId: string
  ) {
    try {
      const body = await request.json();
      const validatedData = await updateMessagingConfigSchema.validate(body, {
        abortEarly: false,
      });

      // Map snake_case to camelCase for ProviderConfig
      const config = validatedData.config
        ? {
            apiToken: validatedData.config.api_token,
            apiUrl: validatedData.config.api_url,
            senderId: validatedData.config.sender_id,
            accountSid: validatedData.config.account_sid,
            authToken: validatedData.config.auth_token,
            apiKey: validatedData.config.api_key,
          }
        : undefined;

      const messagingConfig = await this.updateMessagingConfigUseCase.execute({
        id: configId,
        tenantId,
        config,
        isActive: validatedData.is_active,
      });

      return apiResponse.success({
        data: toMessagingConfigResponse(messagingConfig),
        message: "Messaging configuration updated successfully",
      });
    } catch (error: any) {
      console.error("Update messaging config error:", error);
      if (error.name === "ValidationError") {
        return apiResponse.validationError(error.errors.map((err: string) => ({ field: "general", message: err })));
      }
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      if (error.message.includes("Invalid configuration")) {
        return apiResponse.validationError([{ field: "general", message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Delete Messaging Config
   */
  async deleteMessagingConfig(
    request: Request,
    tenantId: string,
    configId: string
  ) {
    try {
      await this.deleteMessagingConfigUseCase.execute(configId, tenantId);

      return apiResponse.success({
        data: null,
        message: "Messaging configuration deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete messaging config error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Test Messaging Config Connection
   */
  async testMessagingConfig(
    request: Request,
    tenantId: string,
    configId: string
  ) {
    try {
      const result = await this.testMessagingConfigUseCase.execute(
        configId,
        tenantId
      );

      const response: TestConnectionResponse = {
        success: result.success,
        message: result.message,
      };

      return apiResponse.success({
        data: response,
        message: result.success
          ? "Connection test successful"
          : "Connection test failed",
      });
    } catch (error: any) {
      console.error("Test messaging config error:", error);
      if (error.message.includes("not found")) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Available Providers
   */
  async getAvailableProviders(request: Request) {
    try {
      const providers = await this.getAvailableProvidersUseCase.execute();

      const response: ProviderInfoResponse[] = providers.map((provider) => ({
        type: provider.type,
        name: provider.name,
        description: provider.description,
        status: provider.status,
      }));

      return apiResponse.success({
        data: response,
        message: "Available providers retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get available providers error:", error);
      return apiResponse.internalError();
    }
  }
}
