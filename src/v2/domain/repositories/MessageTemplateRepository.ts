/**
 * MessageTemplate Repository Interface
 * Defines contract for message template data access
 */

import { MessageTemplate, MessageEvent } from "../entities/MessageTemplate";

export interface CreateMessageTemplateParams {
  tenantId: string;
  name: string;
  event: MessageEvent;
  message: string;
  isCustom: boolean;
}

export interface UpdateMessageTemplateParams {
  name?: string;
  message?: string;
}

export interface MessageTemplateFilters {
  tenantId: string;
  event?: MessageEvent;
  isCustom?: boolean;
}

export interface MessageTemplateRepository {
  /**
   * Create a new message template
   */
  create(params: CreateMessageTemplateParams): Promise<MessageTemplate>;

  /**
   * Find template by ID
   */
  findById(id: string, tenantId: string): Promise<MessageTemplate | null>;

  /**
   * Find all templates for a tenant
   */
  findAll(filters: MessageTemplateFilters): Promise<MessageTemplate[]>;

  /**
   * Find template by event
   */
  findByEvent(tenantId: string, event: MessageEvent): Promise<MessageTemplate | null>;

  /**
   * Update template
   */
  update(
    id: string,
    tenantId: string,
    params: UpdateMessageTemplateParams
  ): Promise<MessageTemplate>;

  /**
   * Delete template
   */
  delete(id: string, tenantId: string): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: string, tenantId: string): Promise<boolean>;
}
