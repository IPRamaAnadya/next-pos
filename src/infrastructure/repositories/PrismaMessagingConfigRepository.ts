/**
 * Prisma Messaging Config Repository Implementation
 * Maps between domain entities and Prisma schema (TenantNotificationConfig)
 */

import prisma from "@/lib/prisma";
import { MessagingConfig, MessagingProvider, ProviderConfig } from "@/domain/entities/MessagingConfig";
import {
  MessagingConfigRepository,
  CreateMessagingConfigParams,
  UpdateMessagingConfigParams,
} from "@/domain/repositories/MessagingConfigRepository";

export class PrismaMessagingConfigRepository implements MessagingConfigRepository {
  private static instance: PrismaMessagingConfigRepository;

  private constructor() {}

  public static getInstance(): PrismaMessagingConfigRepository {
    if (!PrismaMessagingConfigRepository.instance) {
      PrismaMessagingConfigRepository.instance = new PrismaMessagingConfigRepository();
    }
    return PrismaMessagingConfigRepository.instance;
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToDomain(prismaConfig: any): MessagingConfig {
    // Parse provider config JSON to ProviderConfig
    const config: ProviderConfig = {
      apiToken: prismaConfig.apiToken,
      apiUrl: prismaConfig.apiUrl,
    };

    return new MessagingConfig({
      id: prismaConfig.id,
      tenantId: prismaConfig.tenantId,
      provider: prismaConfig.provider as MessagingProvider,
      config,
      isActive: prismaConfig.isActive,
      createdAt: prismaConfig.createdAt,
      updatedAt: prismaConfig.updatedAt,
    });
  }

  async create(params: CreateMessagingConfigParams): Promise<MessagingConfig> {
    const prismaConfig = await prisma.tenantNotificationConfig.create({
      data: {
        tenantId: params.tenantId,
        provider: params.provider,
        apiToken: params.config.apiToken || "",
        apiUrl: params.config.apiUrl || "https://api.fonnte.com/send",
        isActive: params.isActive,
      },
    });

    return this.mapToDomain(prismaConfig);
  }

  async findById(id: string, tenantId: string): Promise<MessagingConfig | null> {
    const prismaConfig = await prisma.tenantNotificationConfig.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return prismaConfig ? this.mapToDomain(prismaConfig) : null;
  }

  async findAllByTenant(tenantId: string): Promise<MessagingConfig[]> {
    const prismaConfigs = await prisma.tenantNotificationConfig.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return prismaConfigs.map((config: any) => this.mapToDomain(config));
  }

  async findByProvider(
    tenantId: string,
    provider: MessagingProvider
  ): Promise<MessagingConfig | null> {
    const prismaConfig = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId,
        provider,
      },
    });

    return prismaConfig ? this.mapToDomain(prismaConfig) : null;
  }

  async findActiveByProvider(
    tenantId: string,
    provider: MessagingProvider
  ): Promise<MessagingConfig | null> {
    const prismaConfig = await prisma.tenantNotificationConfig.findFirst({
      where: {
        tenantId,
        provider,
        isActive: true,
      },
    });

    return prismaConfig ? this.mapToDomain(prismaConfig) : null;
  }

  async update(
    id: string,
    tenantId: string,
    params: UpdateMessagingConfigParams
  ): Promise<MessagingConfig> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (params.config) {
      if (params.config.apiToken !== undefined) {
        updateData.apiToken = params.config.apiToken;
      }
      if (params.config.apiUrl !== undefined) {
        updateData.apiUrl = params.config.apiUrl;
      }
    }

    if (params.isActive !== undefined) {
      updateData.isActive = params.isActive;
    }

    const prismaConfig = await prisma.tenantNotificationConfig.update({
      where: {
        id,
      },
      data: updateData,
    });

    return this.mapToDomain(prismaConfig);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.tenantNotificationConfig.delete({
      where: {
        id,
      },
    });
  }

  async exists(id: string, tenantId: string): Promise<boolean> {
    const count = await prisma.tenantNotificationConfig.count({
      where: {
        id,
        tenantId,
      },
    });

    return count > 0;
  }

  async deactivateAll(tenantId: string): Promise<void> {
    await prisma.tenantNotificationConfig.updateMany({
      where: {
        tenantId,
      },
      data: {
        isActive: false,
      },
    });
  }
}
