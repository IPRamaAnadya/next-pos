/**
 * MessagingProvider Interface
 * Strategy pattern for different messaging providers
 */

import { MessagingProvider as ProviderType, ProviderConfig } from "../entities/MessagingConfig";

export interface SendMessageParams {
  recipient: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  errorMessage?: string;
}

export interface ProviderInfo {
  name: string;
  type: ProviderType;
  description: string;
  supportedChannels: string[];
  requiredConfig: string[];
  features: string[];
}

/**
 * Base interface for all messaging providers
 */
export interface IMessagingProvider {
  /**
   * Send a message to a recipient
   */
  send(params: SendMessageParams): Promise<SendMessageResult>;

  /**
   * Validate provider configuration
   */
  validateConfig(config: ProviderConfig): { isValid: boolean; errors: string[] };

  /**
   * Get provider information
   */
  getInfo(): ProviderInfo;

  /**
   * Test provider connection
   */
  testConnection(): Promise<{ success: boolean; message: string }>;
}
