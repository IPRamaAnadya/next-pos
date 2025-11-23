/**
 * Message Template Use Cases
 * Application layer business logic for template management
 */

import { MessageTemplate, MessageEvent } from "../../domain/entities/MessageTemplate";
import { MessageTemplateRepository } from "../../domain/repositories/MessageTemplateRepository";

/**
 * Create Message Template Use Case
 */
export class CreateMessageTemplateUseCase {
  private static instance: CreateMessageTemplateUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): CreateMessageTemplateUseCase {
    if (!CreateMessageTemplateUseCase.instance) {
      CreateMessageTemplateUseCase.instance = new CreateMessageTemplateUseCase(
        templateRepository
      );
    }
    return CreateMessageTemplateUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    name: string;
    event: MessageEvent;
    message: string;
    isCustom: boolean;
  }): Promise<MessageTemplate> {
    // Check if template with same event already exists (for non-custom templates)
    if (!params.isCustom) {
      const existing = await this.templateRepository.findByEvent(params.tenantId, params.event);
      if (existing) {
        throw new Error(`Template for event ${params.event} already exists`);
      }
    }

    return await this.templateRepository.create(params);
  }
}

/**
 * Get Message Templates Use Case
 */
export class GetMessageTemplatesUseCase {
  private static instance: GetMessageTemplatesUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): GetMessageTemplatesUseCase {
    if (!GetMessageTemplatesUseCase.instance) {
      GetMessageTemplatesUseCase.instance = new GetMessageTemplatesUseCase(
        templateRepository
      );
    }
    return GetMessageTemplatesUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    event?: MessageEvent;
    isCustom?: boolean;
  }): Promise<MessageTemplate[]> {
    return await this.templateRepository.findAll(params);
  }
}

/**
 * Get Message Template by ID Use Case
 */
export class GetMessageTemplateByIdUseCase {
  private static instance: GetMessageTemplateByIdUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): GetMessageTemplateByIdUseCase {
    if (!GetMessageTemplateByIdUseCase.instance) {
      GetMessageTemplateByIdUseCase.instance = new GetMessageTemplateByIdUseCase(
        templateRepository
      );
    }
    return GetMessageTemplateByIdUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findById(id, tenantId);

    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    return template;
  }
}

/**
 * Update Message Template Use Case
 */
export class UpdateMessageTemplateUseCase {
  private static instance: UpdateMessageTemplateUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): UpdateMessageTemplateUseCase {
    if (!UpdateMessageTemplateUseCase.instance) {
      UpdateMessageTemplateUseCase.instance = new UpdateMessageTemplateUseCase(
        templateRepository
      );
    }
    return UpdateMessageTemplateUseCase.instance;
  }

  async execute(params: {
    id: string;
    tenantId: string;
    name?: string;
    message?: string;
  }): Promise<MessageTemplate> {
    // Check if template exists and is editable
    const template = await this.templateRepository.findById(params.id, params.tenantId);

    if (!template) {
      throw new Error(`Template not found: ${params.id}`);
    }

    if (!template.isEditable()) {
      throw new Error("Cannot edit system template");
    }

    return await this.templateRepository.update(params.id, params.tenantId, {
      name: params.name,
      message: params.message,
    });
  }
}

/**
 * Delete Message Template Use Case
 */
export class DeleteMessageTemplateUseCase {
  private static instance: DeleteMessageTemplateUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): DeleteMessageTemplateUseCase {
    if (!DeleteMessageTemplateUseCase.instance) {
      DeleteMessageTemplateUseCase.instance = new DeleteMessageTemplateUseCase(
        templateRepository
      );
    }
    return DeleteMessageTemplateUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<void> {
    // Check if template exists and is editable
    const template = await this.templateRepository.findById(id, tenantId);

    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    if (!template.isEditable()) {
      throw new Error("Cannot delete system template");
    }

    await this.templateRepository.delete(id, tenantId);
  }
}

/**
 * Preview Message Template Use Case
 */
export class PreviewMessageTemplateUseCase {
  private static instance: PreviewMessageTemplateUseCase;

  private constructor(private templateRepository: MessageTemplateRepository) {}

  public static getInstance(
    templateRepository: MessageTemplateRepository
  ): PreviewMessageTemplateUseCase {
    if (!PreviewMessageTemplateUseCase.instance) {
      PreviewMessageTemplateUseCase.instance = new PreviewMessageTemplateUseCase(
        templateRepository
      );
    }
    return PreviewMessageTemplateUseCase.instance;
  }

  async execute(params: {
    id: string;
    tenantId: string;
    variables: Record<string, string | number>;
  }): Promise<{
    success: boolean;
    renderedMessage?: string;
    missingVariables?: string[];
  }> {
    const template = await this.templateRepository.findById(params.id, params.tenantId);

    if (!template) {
      throw new Error(`Template not found: ${params.id}`);
    }

    return template.preview(params.variables);
  }
}
