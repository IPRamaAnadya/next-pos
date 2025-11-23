/**
 * MessagingProviderFactory
 * Factory to create messaging provider instances based on configuration
 */

import { IMessagingProvider } from "../../domain/services/IMessagingProvider";
import {
  MessagingProvider,
  ProviderConfig,
} from "../../domain/entities/MessagingConfig";
import { FonnteProvider } from "./FonnteProvider";

export class MessagingProviderFactory {
  private static instance: MessagingProviderFactory;

  private constructor() {}

  public static getInstance(): MessagingProviderFactory {
    if (!MessagingProviderFactory.instance) {
      MessagingProviderFactory.instance = new MessagingProviderFactory();
    }
    return MessagingProviderFactory.instance;
  }

  /**
   * Create a messaging provider instance
   */
  public createProvider(
    providerType: MessagingProvider,
    config: ProviderConfig
  ): IMessagingProvider {
    switch (providerType) {
      case MessagingProvider.FONNTE:
        return new FonnteProvider(config);

      case MessagingProvider.TWILIO:
        // TODO: Implement TwilioProvider
        throw new Error("Twilio provider not yet implemented");

      case MessagingProvider.SENDGRID:
        // TODO: Implement SendGridProvider
        throw new Error("SendGrid provider not yet implemented");

      case MessagingProvider.CUSTOM:
        // TODO: Implement CustomProvider
        throw new Error("Custom provider not yet implemented");

      default:
        throw new Error(`Unsupported provider: ${providerType}`);
    }
  }

  /**
   * Get list of available providers
   */
  public getAvailableProviders(): Array<{
    type: MessagingProvider;
    name: string;
    description: string;
    status: "available" | "coming_soon";
  }> {
    return [
      {
        type: MessagingProvider.FONNTE,
        name: "Fonnte",
        description: "WhatsApp messaging service",
        status: "available",
      },
      {
        type: MessagingProvider.TWILIO,
        name: "Twilio",
        description: "SMS and WhatsApp messaging",
        status: "coming_soon",
      },
      {
        type: MessagingProvider.SENDGRID,
        name: "SendGrid",
        description: "Email messaging service",
        status: "coming_soon",
      },
      {
        type: MessagingProvider.CUSTOM,
        name: "Custom Provider",
        description: "Custom webhook-based messaging",
        status: "coming_soon",
      },
    ];
  }

  /**
   * Check if provider is supported
   */
  public isProviderSupported(providerType: MessagingProvider): boolean {
    return providerType === MessagingProvider.FONNTE;
  }
}
