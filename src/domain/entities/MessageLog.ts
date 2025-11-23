/**
 * MessageLog Entity
 * Represents a sent message record for tracking and audit
 */

export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  DELIVERED = "delivered",
}

export interface MessageLogProps {
  id: string;
  tenantId: string;
  configId: string;
  templateId?: string;
  recipient: string;
  message: string;
  status: MessageStatus;
  providerResponse?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageLog {
  constructor(private props: MessageLogProps) {}

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get configId(): string {
    return this.props.configId;
  }

  get templateId(): string | undefined {
    return this.props.templateId;
  }

  get recipient(): string {
    return this.props.recipient;
  }

  get message(): string {
    return this.props.message;
  }

  get status(): MessageStatus {
    return this.props.status;
  }

  get providerResponse(): string | undefined {
    return this.props.providerResponse;
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Mark message as sent
   */
  public markAsSent(providerResponse?: string): void {
    this.props.status = MessageStatus.SENT;
    this.props.sentAt = new Date();
    this.props.providerResponse = providerResponse;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark message as failed
   */
  public markAsFailed(errorMessage: string): void {
    this.props.status = MessageStatus.FAILED;
    this.props.errorMessage = errorMessage;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark message as delivered
   */
  public markAsDelivered(): void {
    this.props.status = MessageStatus.DELIVERED;
    this.props.deliveredAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if message was successful
   */
  public isSuccessful(): boolean {
    return this.props.status === MessageStatus.SENT || 
           this.props.status === MessageStatus.DELIVERED;
  }

  /**
   * Check if message failed
   */
  public isFailed(): boolean {
    return this.props.status === MessageStatus.FAILED;
  }

  /**
   * Get delivery time in milliseconds
   */
  public getDeliveryTimeMs(): number | null {
    if (!this.props.sentAt || !this.props.deliveredAt) {
      return null;
    }
    return this.props.deliveredAt.getTime() - this.props.sentAt.getTime();
  }

  /**
   * Get formatted status
   */
  public getStatusDisplay(): string {
    switch (this.props.status) {
      case MessageStatus.PENDING:
        return "Pending";
      case MessageStatus.SENT:
        return "Sent";
      case MessageStatus.FAILED:
        return "Failed";
      case MessageStatus.DELIVERED:
        return "Delivered";
      default:
        return "Unknown";
    }
  }

  /**
   * Check if message used a template
   */
  public isFromTemplate(): boolean {
    return this.props.templateId !== undefined && this.props.templateId !== null;
  }

  public toJSON(): MessageLogProps {
    return { ...this.props };
  }
}
