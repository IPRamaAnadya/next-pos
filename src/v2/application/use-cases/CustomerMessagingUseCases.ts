/**
 * Customer Messaging Use Cases
 * Application layer business logic for messaging operations
 */

import { MessageTemplate, MessageEvent } from "../../domain/entities/MessageTemplate";
import { MessagingConfig, MessagingProvider } from "../../domain/entities/MessagingConfig";
import { MessageLog, MessageStatus } from "../../domain/entities/MessageLog";
import { MessageTemplateRepository } from "../../domain/repositories/MessageTemplateRepository";
import { MessagingConfigRepository } from "../../domain/repositories/MessagingConfigRepository";
import { MessageLogRepository } from "../../domain/repositories/MessageLogRepository";
import { MessagingProviderFactory } from "../../infrastructure/services/MessagingProviderFactory";
import { IMessagingProvider } from "../../domain/services/IMessagingProvider";

/**
 * Send Message Use Case
 */
export class SendMessageUseCase {
  private static instance: SendMessageUseCase;

  private constructor(
    private messageLogRepository: MessageLogRepository,
    private configRepository: MessagingConfigRepository,
    private templateRepository: MessageTemplateRepository,
    private providerFactory: MessagingProviderFactory
  ) {}

  public static getInstance(
    messageLogRepository: MessageLogRepository,
    configRepository: MessagingConfigRepository,
    templateRepository: MessageTemplateRepository,
    providerFactory: MessagingProviderFactory
  ): SendMessageUseCase {
    if (!SendMessageUseCase.instance) {
      SendMessageUseCase.instance = new SendMessageUseCase(
        messageLogRepository,
        configRepository,
        templateRepository,
        providerFactory
      );
    }
    return SendMessageUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    provider: MessagingProvider;
    recipient: string;
    message: string;
  }): Promise<MessageLog> {
    // 1. Get active configuration for the provider
    const config = await this.configRepository.findActiveByProvider(
      params.tenantId,
      params.provider
    );

    if (!config) {
      throw new Error(`No active configuration found for provider: ${params.provider}`);
    }

    if (!config.isReady()) {
      throw new Error(`Provider configuration is not ready: ${params.provider}`);
    }

    // 2. Create provider instance
    const provider: IMessagingProvider = this.providerFactory.createProvider(
      params.provider,
      config.config
    );

    // 3. Create message log (pending)
    const messageLog = await this.messageLogRepository.create({
      tenantId: params.tenantId,
      configId: config.id,
      recipient: params.recipient,
      message: params.message,
      status: MessageStatus.PENDING,
    });

    // 4. Send message via provider
    const result = await provider.send({
      recipient: params.recipient,
      message: params.message,
    });

    // 5. Update message log based on result
    if (result.success) {
      const updatedLog = await this.messageLogRepository.update(messageLog.id, params.tenantId, {
        status: MessageStatus.SENT,
        providerResponse: result.providerResponse,
        sentAt: new Date(),
      });
      return updatedLog;
    } else {
      const updatedLog = await this.messageLogRepository.update(messageLog.id, params.tenantId, {
        status: MessageStatus.FAILED,
        errorMessage: result.errorMessage,
        providerResponse: result.providerResponse,
      });
      throw new Error(`Failed to send message: ${result.errorMessage}`);
    }
  }
}

/**
 * Send Message with Template Use Case
 */
export class SendMessageWithTemplateUseCase {
  private static instance: SendMessageWithTemplateUseCase;

  private constructor(
    private messageLogRepository: MessageLogRepository,
    private configRepository: MessagingConfigRepository,
    private templateRepository: MessageTemplateRepository,
    private providerFactory: MessagingProviderFactory
  ) {}

  public static getInstance(
    messageLogRepository: MessageLogRepository,
    configRepository: MessagingConfigRepository,
    templateRepository: MessageTemplateRepository,
    providerFactory: MessagingProviderFactory
  ): SendMessageWithTemplateUseCase {
    if (!SendMessageWithTemplateUseCase.instance) {
      SendMessageWithTemplateUseCase.instance = new SendMessageWithTemplateUseCase(
        messageLogRepository,
        configRepository,
        templateRepository,
        providerFactory
      );
    }
    return SendMessageWithTemplateUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    provider: MessagingProvider;
    templateId: string;
    recipient: string;
    variables: Record<string, string | number>;
  }): Promise<MessageLog> {
    // 1. Get template
    const template = await this.templateRepository.findById(params.templateId, params.tenantId);

    if (!template) {
      throw new Error(`Template not found: ${params.templateId}`);
    }

    // 2. Validate variables
    const validation = template.validateVariables(params.variables);
    if (!validation.isValid) {
      throw new Error(
        `Missing required variables: ${validation.missingVariables.join(", ")}`
      );
    }

    // 3. Render message
    const renderedMessage = template.renderMessage(params.variables);

    // 4. Get active configuration for the provider
    const config = await this.configRepository.findActiveByProvider(
      params.tenantId,
      params.provider
    );

    if (!config) {
      throw new Error(`No active configuration found for provider: ${params.provider}`);
    }

    if (!config.isReady()) {
      throw new Error(`Provider configuration is not ready: ${params.provider}`);
    }

    // 5. Create provider instance
    const provider: IMessagingProvider = this.providerFactory.createProvider(
      params.provider,
      config.config
    );

    // 6. Create message log (pending) with template ID
    const messageLog = await this.messageLogRepository.create({
      tenantId: params.tenantId,
      configId: config.id,
      templateId: template.id,
      recipient: params.recipient,
      message: renderedMessage,
      status: MessageStatus.PENDING,
    });

    // 7. Send message via provider
    const result = await provider.send({
      recipient: params.recipient,
      message: renderedMessage,
    });

    // 8. Update message log based on result
    if (result.success) {
      const updatedLog = await this.messageLogRepository.update(messageLog.id, params.tenantId, {
        status: MessageStatus.SENT,
        providerResponse: result.providerResponse,
        sentAt: new Date(),
      });
      return updatedLog;
    } else {
      const updatedLog = await this.messageLogRepository.update(messageLog.id, params.tenantId, {
        status: MessageStatus.FAILED,
        errorMessage: result.errorMessage,
        providerResponse: result.providerResponse,
      });
      throw new Error(`Failed to send message: ${result.errorMessage}`);
    }
  }
}

/**
 * Get Message Logs Use Case
 */
export class GetMessageLogsUseCase {
  private static instance: GetMessageLogsUseCase;

  private constructor(private messageLogRepository: MessageLogRepository) {}

  public static getInstance(
    messageLogRepository: MessageLogRepository
  ): GetMessageLogsUseCase {
    if (!GetMessageLogsUseCase.instance) {
      GetMessageLogsUseCase.instance = new GetMessageLogsUseCase(messageLogRepository);
    }
    return GetMessageLogsUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    configId?: string;
    templateId?: string;
    status?: MessageStatus;
    recipient?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    return await this.messageLogRepository.findAll(params);
  }
}

/**
 * Get Message Log by ID Use Case
 */
export class GetMessageLogByIdUseCase {
  private static instance: GetMessageLogByIdUseCase;

  private constructor(private messageLogRepository: MessageLogRepository) {}

  public static getInstance(
    messageLogRepository: MessageLogRepository
  ): GetMessageLogByIdUseCase {
    if (!GetMessageLogByIdUseCase.instance) {
      GetMessageLogByIdUseCase.instance = new GetMessageLogByIdUseCase(messageLogRepository);
    }
    return GetMessageLogByIdUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<MessageLog> {
    const messageLog = await this.messageLogRepository.findById(id, tenantId);

    if (!messageLog) {
      throw new Error(`Message log not found: ${id}`);
    }

    return messageLog;
  }
}
