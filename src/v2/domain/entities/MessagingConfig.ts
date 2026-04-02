/**
 * MessagingConfig Entity
 * Represents tenant's messaging provider configuration
 */

export enum MessagingProvider {
  FONNTE = "fonnte",
  TWILIO = "twilio",
  SENDGRID = "sendgrid",
  CUSTOM = "custom",
}

export interface ProviderConfig {
  apiToken?: string;
  apiUrl?: string;
  senderId?: string;
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  [key: string]: string | undefined;
}

export interface MessagingConfigProps {
  id: string;
  tenantId: string;
  provider: MessagingProvider;
  config: ProviderConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingConfig {
  constructor(private props: MessagingConfigProps) {}

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get provider(): MessagingProvider {
    return this.props.provider;
  }

  get config(): ProviderConfig {
    return this.props.config;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Validate provider-specific configuration
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (this.props.provider) {
      case MessagingProvider.FONNTE:
        if (!this.props.config.apiToken) {
          errors.push("Fonnte requires apiToken");
        }
        if (!this.props.config.apiUrl) {
          errors.push("Fonnte requires apiUrl");
        }
        break;

      case MessagingProvider.TWILIO:
        if (!this.props.config.accountSid) {
          errors.push("Twilio requires accountSid");
        }
        if (!this.props.config.authToken) {
          errors.push("Twilio requires authToken");
        }
        if (!this.props.config.senderId) {
          errors.push("Twilio requires senderId (phone number)");
        }
        break;

      case MessagingProvider.SENDGRID:
        if (!this.props.config.apiKey) {
          errors.push("SendGrid requires apiKey");
        }
        if (!this.props.config.senderId) {
          errors.push("SendGrid requires senderId (email)");
        }
        break;

      case MessagingProvider.CUSTOM:
        if (!this.props.config.apiUrl) {
          errors.push("Custom provider requires apiUrl");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if configuration is ready to use
   */
  public isReady(): boolean {
    return this.props.isActive && this.validateConfig().isValid;
  }

  /**
   * Activate the configuration
   */
  public activate(): void {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(
        `Cannot activate invalid configuration: ${validation.errors.join(", ")}`
      );
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the configuration
   */
  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ProviderConfig>): void {
    this.props.config = { ...this.props.config, ...config };
    this.props.updatedAt = new Date();
  }

  /**
   * Get masked configuration (hide sensitive data)
   */
  public getMaskedConfig(): ProviderConfig {
    const maskedConfig: ProviderConfig = {};

    Object.entries(this.props.config).forEach(([key, value]) => {
      if (key.toLowerCase().includes("token") || key.toLowerCase().includes("key")) {
        maskedConfig[key] = value ? `${value.substring(0, 4)}****` : undefined;
      } else {
        maskedConfig[key] = value;
      }
    });

    return maskedConfig;
  }

  /**
   * Get provider display name
   */
  public getProviderName(): string {
    switch (this.props.provider) {
      case MessagingProvider.FONNTE:
        return "Fonnte (WhatsApp)";
      case MessagingProvider.TWILIO:
        return "Twilio (SMS/WhatsApp)";
      case MessagingProvider.SENDGRID:
        return "SendGrid (Email)";
      case MessagingProvider.CUSTOM:
        return "Custom Provider";
      default:
        return "Unknown Provider";
    }
  }

  public toJSON(): MessagingConfigProps {
    return { ...this.props };
  }
}
