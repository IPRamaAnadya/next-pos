/**
 * Prisma Message Template Repository Implementation
 * Maps between domain entities and Prisma schema
 */

import prisma from "@/lib/prisma";
import { MessageTemplate, MessageEvent } from "@/domain/entities/MessageTemplate";
import {
  MessageTemplateRepository,
  CreateMessageTemplateParams,
  UpdateMessageTemplateParams,
  MessageTemplateFilters,
} from "@/domain/repositories/MessageTemplateRepository";

export class PrismaMessageTemplateRepository implements MessageTemplateRepository {
  private static instance: PrismaMessageTemplateRepository;

  private constructor() {}

  public static getInstance(): PrismaMessageTemplateRepository {
    if (!PrismaMessageTemplateRepository.instance) {
      PrismaMessageTemplateRepository.instance = new PrismaMessageTemplateRepository();
    }
    return PrismaMessageTemplateRepository.instance;
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToDomain(prismaTemplate: any): MessageTemplate {
    return new MessageTemplate({
      id: prismaTemplate.id,
      tenantId: prismaTemplate.tenantId,
      name: prismaTemplate.name,
      event: this.mapEventToDomain(prismaTemplate.event),
      message: prismaTemplate.message,
      isCustom: prismaTemplate.isCustom,
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt,
    });
  }

  /**
   * Map domain MessageEvent to Prisma event string
   */
  private mapEventToPrisma(event: MessageEvent): string | null {
    const eventMap: Record<MessageEvent, string> = {
      [MessageEvent.ORDER_CREATED]: "ORDER_CREATED",
      [MessageEvent.ORDER_UPDATED]: "ORDER_UPDATED",
      [MessageEvent.ORDER_PAID]: "ORDER_PAID",
      [MessageEvent.ORDER_COMPLETED]: "ORDER_COMPLETED",
      [MessageEvent.ORDER_CANCELLED]: "ORDER_CANCELLED",
      [MessageEvent.PAYMENT_REMINDER]: "PAYMENT_REMINDER",
      [MessageEvent.CUSTOM]: "CUSTOM",
    };
    return eventMap[event] || null;
  }

  /**
   * Map Prisma event string to domain MessageEvent
   */
  private mapEventToDomain(event: string | null): MessageEvent {
    if (!event) return MessageEvent.CUSTOM;

    const eventMap: Record<string, MessageEvent> = {
      ORDER_CREATED: MessageEvent.ORDER_CREATED,
      ORDER_UPDATED: MessageEvent.ORDER_UPDATED,
      ORDER_PAID: MessageEvent.ORDER_PAID,
      ORDER_COMPLETED: MessageEvent.ORDER_COMPLETED,
      ORDER_CANCELLED: MessageEvent.ORDER_CANCELLED,
      PAYMENT_REMINDER: MessageEvent.PAYMENT_REMINDER,
      CUSTOM: MessageEvent.CUSTOM,
    };
    return eventMap[event] || MessageEvent.CUSTOM;
  }

  async create(params: CreateMessageTemplateParams): Promise<MessageTemplate> {
    const prismaTemplate = await prisma.notificationTemplate.create({
      data: {
        tenantId: params.tenantId,
        name: params.name,
        event: this.mapEventToPrisma(params.event) as any,
        message: params.message,
        isCustom: params.isCustom,
        isActive: true,
      },
    });

    return this.mapToDomain(prismaTemplate);
  }

  async findById(id: string, tenantId: string): Promise<MessageTemplate | null> {
    const prismaTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return prismaTemplate ? this.mapToDomain(prismaTemplate) : null;
  }

  async findAll(filters: MessageTemplateFilters): Promise<MessageTemplate[]> {
    // Build where clause dynamically
    const where: any = {
      tenantId: filters.tenantId,
      isActive: true,
    };

    // Handle event filter - if undefined and isCustom is true, filter for null events
    if (filters.event !== undefined) {
      where.event = this.mapEventToPrisma(filters.event);
    } else if (filters.isCustom === true) {
      where.event = null; // Custom templates have null event
    }

    // Add isCustom filter if specified
    if (filters.isCustom !== undefined) {
      where.isCustom = filters.isCustom;
    }

    const prismaTemplates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return prismaTemplates.map((template: any) => this.mapToDomain(template));
  }

  async findByEvent(tenantId: string, event: MessageEvent): Promise<MessageTemplate | null> {
    const prismaTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        tenantId,
        event: this.mapEventToPrisma(event) as any,
        isActive: true,
      },
    });

    return prismaTemplate ? this.mapToDomain(prismaTemplate) : null;
  }

  async update(
    id: string,
    tenantId: string,
    params: UpdateMessageTemplateParams
  ): Promise<MessageTemplate> {
    const prismaTemplate = await prisma.notificationTemplate.update({
      where: {
        id,
      },
      data: {
        name: params.name,
        message: params.message,
        updatedAt: new Date(),
      },
    });

    return this.mapToDomain(prismaTemplate);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Soft delete by setting isActive to false
    await prisma.notificationTemplate.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }

  async exists(id: string, tenantId: string): Promise<boolean> {
    const count = await prisma.notificationTemplate.count({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });

    return count > 0;
  }
}
