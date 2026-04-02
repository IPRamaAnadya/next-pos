/**
 * MessagingConfig Repository Interface
 * Defines contract for messaging configuration data access
 */

import { MessagingConfig, MessagingProvider, ProviderConfig } from "../entities/MessagingConfig";

export interface CreateMessagingConfigParams {
  tenantId: string;
  provider: MessagingProvider;
  config: ProviderConfig;
  isActive: boolean;
}

export interface UpdateMessagingConfigParams {
  config?: ProviderConfig;
  isActive?: boolean;
}

export interface MessagingConfigRepository {
  /**
   * Create a new messaging configuration
   */
  create(params: CreateMessagingConfigParams): Promise<MessagingConfig>;

  /**
   * Find configuration by ID
   */
  findById(id: string, tenantId: string): Promise<MessagingConfig | null>;

  /**
   * Find all configurations for a tenant
   */
  findAllByTenant(tenantId: string): Promise<MessagingConfig[]>;

  /**
   * Find configuration by provider
   */
  findByProvider(
    tenantId: string,
    provider: MessagingProvider
  ): Promise<MessagingConfig | null>;

  /**
   * Find active configuration by provider
   */
  findActiveByProvider(
    tenantId: string,
    provider: MessagingProvider
  ): Promise<MessagingConfig | null>;

  /**
   * Update configuration
   */
  update(
    id: string,
    tenantId: string,
    params: UpdateMessagingConfigParams
  ): Promise<MessagingConfig>;

  /**
   * Delete configuration
   */
  delete(id: string, tenantId: string): Promise<void>;

  /**
   * Check if configuration exists
   */
  exists(id: string, tenantId: string): Promise<boolean>;

  /**
   * Deactivate all configurations for a tenant (useful when switching providers)
   */
  deactivateAll(tenantId: string): Promise<void>;
}
