/**
 * Fonnte WhatsApp Provider Implementation
 * Implements IMessagingProvider for Fonnte service
 */

import axios, { AxiosInstance } from "axios";
import {
  IMessagingProvider,
  SendMessageParams,
  SendMessageResult,
  ProviderInfo,
} from "../../domain/services/IMessagingProvider";
import {
  MessagingProvider,
  ProviderConfig,
} from "../../domain/entities/MessagingConfig";

export class FonnteProvider implements IMessagingProvider {
  private apiUrl: string;
  private apiToken: string;
  private client: AxiosInstance;

  constructor(config: ProviderConfig) {
    if (!config.apiUrl || !config.apiToken) {
      throw new Error("Fonnte requires apiUrl and apiToken");
    }

    this.apiUrl = 'https://api.fonnte.com';
    this.apiToken = config.apiToken;

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000, // 30 seconds
    });
  }

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      // Format phone number (remove non-digits, ensure country code)
      const recipient = this.formatPhoneNumber(params.recipient);

      // Fonnte uses GET request with query parameters
      const response = await this.client.get("/send", {
        params: {
          token: this.apiToken,
          target: recipient,
          message: params.message,
        },
      });

      if (response.data.status === true || response.data.status === "success") {
        return {
          success: true,
          messageId: response.data.id || response.data.message_id,
          providerResponse: JSON.stringify(response.data),
        };
      } else {
        return {
          success: false,
          errorMessage: response.data.reason || response.data.message || "Unknown error",
          providerResponse: JSON.stringify(response.data),
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.response?.data?.message || error.message || "Failed to send message",
        providerResponse: error.response?.data ? JSON.stringify(error.response.data) : undefined,
      };
    }
  }

  validateConfig(config: ProviderConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiUrl) {
      errors.push("apiUrl is required");
    }

    if (!config.apiToken) {
      errors.push("apiToken is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getInfo(): ProviderInfo {
    return {
      name: "Fonnte",
      type: MessagingProvider.FONNTE,
      description: "WhatsApp messaging service powered by Fonnte",
      supportedChannels: ["WhatsApp"],
      requiredConfig: ["apiUrl", "apiToken"],
      features: [
        "Text messages",
        "Media messages (images, documents)",
        "Message templates",
        "Delivery status tracking",
      ],
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get("/device");

      if (response.data.status === true || response.data.status === "success") {
        return {
          success: true,
          message: "Connection successful. Device is connected.",
        };
      } else {
        return {
          success: false,
          message: response.data.reason || "Device not connected",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Connection failed",
      };
    }
  }

  /**
   * Format phone number for Fonnte
   * Remove non-digits, ensure starts with country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let formatted = phone.replace(/\D/g, "");

    // If starts with 0, replace with 62 (Indonesia)
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.substring(1);
    }

    // If doesn't start with country code, add 62
    if (!formatted.startsWith("62")) {
      formatted = "62" + formatted;
    }

    return formatted;
  }
}
