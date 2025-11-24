/**
 * MessageTemplate Entity
 * Represents a reusable message template with variable placeholders
 */

export enum MessageEvent {
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_UPDATED = "ORDER_UPDATED",
  ORDER_PAID = "ORDER_PAID",
  ORDER_COMPLETED = "ORDER_COMPLETED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  CUSTOM = "CUSTOM",
}

export interface MessageTemplateProps {
  id: string;
  tenantId: string;
  name: string;
  event: MessageEvent;
  message: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageTemplate {
  constructor(private props: MessageTemplateProps) {}

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get event(): MessageEvent {
    return this.props.event;
  }

  get message(): string {
    return this.props.message;
  }

  get isCustom(): boolean {
    return this.props.isCustom;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Replace template variables with actual values
   * Example: "Hello {{customerName}}, your order {{orderNumber}} is ready!"
   */
  public renderMessage(variables: Record<string, string | number>): string {
    let renderedMessage = this.props.message;

    // Replace all {{variable}} placeholders with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      renderedMessage = renderedMessage.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        String(value)
      );
    });

    return renderedMessage;
  }

  /**
   * Extract all variable names from the template
   * Example: "Hello {{customerName}}, order {{orderNumber}}" => ["customerName", "orderNumber"]
   */
  public getRequiredVariables(): string[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(this.props.message)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Validate if all required variables are provided
   */
  public validateVariables(variables: Record<string, string | number>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const requiredVariables = this.getRequiredVariables();
    const providedVariables = Object.keys(variables);

    const missingVariables = requiredVariables.filter(
      (variable) => !providedVariables.includes(variable)
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Check if template is editable (custom templates can be deleted/edited)
   */
  public isEditable(): boolean {
    return this.props.isCustom;
  }

  /**
   * Update template message
   */
  public updateMessage(message: string): void {
    if (!this.isEditable()) {
      throw new Error("Cannot edit system template");
    }
    this.props.message = message;
    this.props.updatedAt = new Date();
  }

  /**
   * Update template name
   */
  public updateName(name: string): void {
    if (!this.isEditable()) {
      throw new Error("Cannot edit system template");
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a preview of the rendered message
   */
  public preview(variables: Record<string, string | number>): {
    success: boolean;
    renderedMessage?: string;
    missingVariables?: string[];
  } {
    const validation = this.validateVariables(variables);

    if (!validation.isValid) {
      return {
        success: false,
        missingVariables: validation.missingVariables,
      };
    }

    return {
      success: true,
      renderedMessage: this.renderMessage(variables),
    };
  }

  public toJSON(): MessageTemplateProps {
    return { ...this.props };
  }
}
