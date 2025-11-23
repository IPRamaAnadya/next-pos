/**
 * MessageLog Repository Interface
 * Defines contract for message log data access
 */

import { MessageLog, MessageStatus } from "../entities/MessageLog";

export interface CreateMessageLogParams {
  tenantId: string;
  configId: string;
  templateId?: string;
  recipient: string;
  message: string;
  status: MessageStatus;
  providerResponse?: string;
  errorMessage?: string;
}

export interface UpdateMessageLogParams {
  status?: MessageStatus;
  providerResponse?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
}

export interface MessageLogFilters {
  tenantId: string;
  configId?: string;
  templateId?: string;
  status?: MessageStatus;
  recipient?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface PaginatedMessageLogs {
  data: MessageLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MessageLogRepository {
  /**
   * Create a new message log
   */
  create(params: CreateMessageLogParams): Promise<MessageLog>;

  /**
   * Find log by ID
   */
  findById(id: string, tenantId: string): Promise<MessageLog | null>;

  /**
   * Find all logs with filters and pagination
   */
  findAll(filters: MessageLogFilters): Promise<PaginatedMessageLogs>;

  /**
   * Update log
   */
  update(
    id: string,
    tenantId: string,
    params: UpdateMessageLogParams
  ): Promise<MessageLog>;

  /**
   * Count logs by status
   */
  countByStatus(tenantId: string, status: MessageStatus): Promise<number>;

  /**
   * Get recent logs
   */
  findRecent(tenantId: string, limit: number): Promise<MessageLog[]>;

  /**
   * Delete old logs (cleanup)
   */
  deleteOlderThan(tenantId: string, date: Date): Promise<number>;
}
