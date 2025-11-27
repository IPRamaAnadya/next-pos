import prisma from '@/lib/prisma';
import type {
  PushNotificationToken,
  PushNotificationMessage,
  PushNotificationSubscription,
  RegisterTokenDTO,
  SendNotificationDTO,
  SubscribeToTopicDTO,
} from '@/domain/entities/PushNotification';
import type {
  PushNotificationTokenRepository,
  PushNotificationMessageRepository,
  PushNotificationSubscriptionRepository,
} from '@/domain/repositories/PushNotificationRepository';

/**
 * Prisma implementation of PushNotificationTokenRepository
 */
export class PrismaPushNotificationTokenRepository implements PushNotificationTokenRepository {
  async registerToken(dto: RegisterTokenDTO): Promise<PushNotificationToken> {
    // Check if token already exists
    const existing = await prisma.pushNotificationToken.findUnique({
      where: { fcmToken: dto.fcmToken },
    });

    if (existing) {
      // Update existing token
      return await prisma.pushNotificationToken.update({
        where: { fcmToken: dto.fcmToken },
        data: {
          isActive: true,
          lastUsedAt: new Date(),
          deviceType: dto.deviceType,
          deviceId: dto.deviceId,
          userId: dto.userId,
          staffId: dto.staffId,
        },
      });
    }

    // Create new token
    return await prisma.pushNotificationToken.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        staffId: dto.staffId,
        fcmToken: dto.fcmToken,
        deviceType: dto.deviceType,
        deviceId: dto.deviceId,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  async findByFcmToken(fcmToken: string): Promise<PushNotificationToken | null> {
    return await prisma.pushNotificationToken.findUnique({
      where: { fcmToken },
    });
  }

  async findActiveTokensByTenant(tenantId: string): Promise<PushNotificationToken[]> {
    return await prisma.pushNotificationToken.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async findActiveTokensByUser(userId: string): Promise<PushNotificationToken[]> {
    return await prisma.pushNotificationToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async findActiveTokensByStaff(staffId: string): Promise<PushNotificationToken[]> {
    return await prisma.pushNotificationToken.findMany({
      where: {
        staffId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async findOwnerTokensByTenant(tenantId: string): Promise<PushNotificationToken[]> {
    // Find tokens for users who own this tenant
    return await prisma.pushNotificationToken.findMany({
      where: {
        tenantId,
        isActive: true,
        userId: { not: null },
        user: {
          tenants: {
            some: {
              id: tenantId,
            },
          },
        },
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  async updateLastUsed(tokenId: string): Promise<void> {
    await prisma.pushNotificationToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  }

  async deactivateToken(tokenId: string): Promise<void> {
    await prisma.pushNotificationToken.update({
      where: { id: tokenId },
      data: { isActive: false },
    });
  }

  async deleteByFcmToken(fcmToken: string): Promise<void> {
    await prisma.pushNotificationToken.delete({
      where: { fcmToken },
    });
  }

  async deleteInactiveTokens(days: number): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const result = await prisma.pushNotificationToken.deleteMany({
      where: {
        isActive: false,
        lastUsedAt: {
          lt: threshold,
        },
      },
    });

    return result.count;
  }
}

/**
 * Prisma implementation of PushNotificationMessageRepository
 */
export class PrismaPushNotificationMessageRepository implements PushNotificationMessageRepository {
  async create(dto: SendNotificationDTO): Promise<PushNotificationMessage> {
    return await prisma.pushNotificationMessage.create({
      data: {
        tenantId: dto.tenantId,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
        targetType: dto.targetType,
        targetValue: dto.targetValue,
        category: dto.category,
        eventType: dto.eventType,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      },
    }) as PushNotificationMessage;
  }

  async markAsSent(id: string, fcmResponse: any): Promise<void> {
    await prisma.pushNotificationMessage.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        fcmResponse,
      },
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await prisma.pushNotificationMessage.update({
      where: { id },
      data: {
        status: 'failed',
        failedAt: new Date(),
        error,
      },
    });
  }

  async incrementRetryCount(id: string): Promise<void> {
    await prisma.pushNotificationMessage.update({
      where: { id },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  async findPendingForRetry(): Promise<PushNotificationMessage[]> {
    return await prisma.pushNotificationMessage.findMany({
      where: {
        status: 'failed',
        retryCount: {
          lt: prisma.pushNotificationMessage.fields.maxRetries,
        },
      },
      orderBy: {
        failedAt: 'asc',
      },
      take: 100,
    }) as PushNotificationMessage[];
  }

  async findByTenant(tenantId: string, limit?: number): Promise<PushNotificationMessage[]> {
    return await prisma.pushNotificationMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as PushNotificationMessage[];
  }

  async findByCategory(
    tenantId: string,
    category: string,
    limit: number = 50
  ): Promise<PushNotificationMessage[]> {
    return await prisma.pushNotificationMessage.findMany({
      where: {
        tenantId,
        category: {
          equals: category,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as PushNotificationMessage[];
  }

  async getStatistics(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [total, sent, failed, pending] = await Promise.all([
      prisma.pushNotificationMessage.count({ where }),
      prisma.pushNotificationMessage.count({ where: { ...where, status: 'sent' } }),
      prisma.pushNotificationMessage.count({ where: { ...where, status: 'failed' } }),
      prisma.pushNotificationMessage.count({ where: { ...where, status: 'pending' } }),
    ]);

    return { total, sent, failed, pending };
  }
}

/**
 * Prisma implementation of PushNotificationSubscriptionRepository
 */
export class PrismaPushNotificationSubscriptionRepository
  implements PushNotificationSubscriptionRepository
{
  async subscribe(dto: SubscribeToTopicDTO): Promise<PushNotificationSubscription> {
    // Upsert to handle duplicate subscriptions
    return await prisma.pushNotificationSubscription.upsert({
      where: {
        tokenId_topic: {
          tokenId: dto.tokenId,
          topic: dto.topic,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        tenantId: dto.tenantId,
        tokenId: dto.tokenId,
        topic: dto.topic,
        isActive: true,
      },
    });
  }

  async unsubscribe(tokenId: string, topic: string): Promise<void> {
    await prisma.pushNotificationSubscription.updateMany({
      where: {
        tokenId,
        topic,
      },
      data: {
        isActive: false,
      },
    });
  }

  async findByToken(tokenId: string): Promise<PushNotificationSubscription[]> {
    return await prisma.pushNotificationSubscription.findMany({
      where: {
        tokenId,
        isActive: true,
      },
    });
  }

  async findActiveSubscribersByTopic(
    tenantId: string,
    topic: string
  ): Promise<PushNotificationSubscription[]> {
    return await prisma.pushNotificationSubscription.findMany({
      where: {
        tenantId,
        topic,
        isActive: true,
      },
    });
  }

  async isSubscribed(tokenId: string, topic: string): Promise<boolean> {
    const subscription = await prisma.pushNotificationSubscription.findUnique({
      where: {
        tokenId_topic: {
          tokenId,
          topic,
        },
      },
    });

    return subscription?.isActive ?? false;
  }
}
