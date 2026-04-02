/**
 * Prisma Message Log Repository Implementation
 * Maps between domain entities and Prisma schema (NotificationLog)
 */

import prisma from "@/lib/prisma";
import { MessageLog, MessageStatus } from "@/domain/entities/MessageLog";
import {
  MessageLogRepository,
  CreateMessageLogParams,
  UpdateMessageLogParams,
  MessageLogFilters,
  PaginatedMessageLogs,
} from "@/domain/repositories/MessageLogRepository";

export class PrismaMessageLogRepository implements MessageLogRepository {
  private static instance: PrismaMessageLogRepository;

  private constructor() {}

  public static getInstance(): PrismaMessageLogRepository {
    if (!PrismaMessageLogRepository.instance) {
      PrismaMessageLogRepository.instance = new PrismaMessageLogRepository();
    }
    return PrismaMessageLogRepository.instance;
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToDomain(prismaLog: any): MessageLog {
    // Map Prisma status string to domain MessageStatus
    const statusMap: Record<string, MessageStatus> = {
      pending: MessageStatus.PENDING,
      sent: MessageStatus.SENT,
      failed: MessageStatus.FAILED,
      delivered: MessageStatus.DELIVERED,
      success: MessageStatus.SENT, // Legacy mapping
    };

    const status = statusMap[prismaLog.status.toLowerCase()] || MessageStatus.PENDING;

    // Extract provider response and error from JSON
    const providerResponse = prismaLog.response ? JSON.stringify(prismaLog.response) : undefined;
    const errorMessage = prismaLog.error || undefined;

    return new MessageLog({
      id: prismaLog.id,
      tenantId: prismaLog.tenantId,
      configId: prismaLog.configId || "",
      templateId: prismaLog.templateId || undefined,
      recipient: prismaLog.recipient,
      message: prismaLog.message,
      status,
      providerResponse,
      errorMessage,
      sentAt: status === MessageStatus.SENT || status === MessageStatus.DELIVERED ? prismaLog.createdAt : undefined,
      deliveredAt: status === MessageStatus.DELIVERED ? prismaLog.createdAt : undefined,
      createdAt: prismaLog.createdAt,
      updatedAt: prismaLog.createdAt, // NotificationLog doesn't have updatedAt
    });
  }

  /**
   * Map domain MessageStatus to Prisma status string
   */
  private mapStatusToPrisma(status: MessageStatus): string {
    const statusMap: Record<MessageStatus, string> = {
      [MessageStatus.PENDING]: "pending",
      [MessageStatus.SENT]: "sent",
      [MessageStatus.FAILED]: "failed",
      [MessageStatus.DELIVERED]: "delivered",
    };
    return statusMap[status] || "pending";
  }

  async create(params: CreateMessageLogParams): Promise<MessageLog> {
    const prismaLog = await prisma.notificationLog.create({
      data: {
        tenantId: params.tenantId,
        templateId: params.templateId || null,
        recipient: params.recipient,
        message: params.message,
        status: this.mapStatusToPrisma(params.status),
        response: params.providerResponse ? JSON.parse(params.providerResponse) : null,
        error: params.errorMessage || null,
      },
    });

    // Create a modified version with configId for domain mapping
    const logWithConfig = {
      ...prismaLog,
      configId: params.configId,
    };

    return this.mapToDomain(logWithConfig);
  }

  async findById(id: string, tenantId: string): Promise<MessageLog | null> {
    const prismaLog = await prisma.notificationLog.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!prismaLog) return null;

    // Get config ID from the first active config (as NotificationLog doesn't store configId)
    const config = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const logWithConfig = {
      ...prismaLog,
      configId: config?.id || "",
    };

    return this.mapToDomain(logWithConfig);
  }

  async findAll(filters: MessageLogFilters): Promise<PaginatedMessageLogs> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters.status) {
      where.status = this.mapStatusToPrisma(filters.status);
    }

    if (filters.recipient) {
      where.recipient = {
        contains: filters.recipient,
      };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [prismaLogs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.notificationLog.count({ where }),
    ]);

    // Get config ID
    const config = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId: filters.tenantId,
        isActive: true,
      },
    });

    const logsWithConfig = prismaLogs.map((log: any) => ({
      ...log,
      configId: config?.id || "",
    }));

    const data = logsWithConfig.map((log: any) => this.mapToDomain(log));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(
    id: string,
    tenantId: string,
    params: UpdateMessageLogParams
  ): Promise<MessageLog> {
    const updateData: any = {};

    if (params.status) {
      updateData.status = this.mapStatusToPrisma(params.status);
    }

    if (params.providerResponse !== undefined) {
      updateData.response = params.providerResponse ? JSON.parse(params.providerResponse) : null;
    }

    if (params.errorMessage !== undefined) {
      updateData.error = params.errorMessage;
    }

    const prismaLog = await prisma.notificationLog.update({
      where: {
        id,
      },
      data: updateData,
    });

    // Get config ID
    const config = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const logWithConfig = {
      ...prismaLog,
      configId: config?.id || "",
    };

    return this.mapToDomain(logWithConfig);
  }

  async countByStatus(tenantId: string, status: MessageStatus): Promise<number> {
    return await prisma.notificationLog.count({
      where: {
        tenantId,
        status: this.mapStatusToPrisma(status),
      },
    });
  }

  async findRecent(tenantId: string, limit: number): Promise<MessageLog[]> {
    const prismaLogs = await prisma.notificationLog.findMany({
      where: {
        tenantId,
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get config ID
    const config = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const logsWithConfig = prismaLogs.map((log: any) => ({
      ...log,
      configId: config?.id || "",
    }));

    return logsWithConfig.map((log: any) => this.mapToDomain(log));
  }

  async deleteOlderThan(tenantId: string, date: Date): Promise<number> {
    const result = await prisma.notificationLog.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }
}
