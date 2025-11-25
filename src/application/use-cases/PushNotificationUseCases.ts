import type {
  PushNotificationTokenRepository,
  PushNotificationMessageRepository,
  PushNotificationSubscriptionRepository,
} from '@/domain/repositories/PushNotificationRepository';
import type {
  RegisterTokenDTO,
  SendNotificationDTO,
  SubscribeToTopicDTO,
  BroadcastToOwnersDTO,
  PushNotificationToken,
  PushNotificationMessage,
} from '@/domain/entities/PushNotification';
import { fcmService, type SendNotificationOptions } from '@/infrastructure/services/FCMService';

/**
 * Use Case: Register FCM Token
 */
export class RegisterFCMTokenUseCase {
  constructor(private tokenRepository: PushNotificationTokenRepository) {}

  async execute(dto: RegisterTokenDTO): Promise<PushNotificationToken> {
    // Validate FCM token format
    if (!fcmService.isValidToken(dto.fcmToken)) {
      throw new Error('Invalid FCM token format');
    }

    // Register or update token
    const token = await this.tokenRepository.registerToken(dto);
    console.log(`✅ FCM token registered for tenant ${dto.tenantId}`);

    return token;
  }
}

/**
 * Use Case: Deactivate FCM Token
 */
export class DeactivateFCMTokenUseCase {
  constructor(private tokenRepository: PushNotificationTokenRepository) {}

  async execute(fcmToken: string): Promise<void> {
    const token = await this.tokenRepository.findByFcmToken(fcmToken);
    
    if (!token) {
      throw new Error('Token not found');
    }

    await this.tokenRepository.deactivateToken(token.id);
    console.log(`✅ FCM token deactivated: ${token.id}`);
  }
}

/**
 * Use Case: Send Push Notification
 */
export class SendPushNotificationUseCase {
  constructor(
    private messageRepository: PushNotificationMessageRepository,
    private tokenRepository: PushNotificationTokenRepository
  ) {}

  async execute(dto: SendNotificationDTO): Promise<PushNotificationMessage> {
    // Create message record
    const message = await this.messageRepository.create(dto);

    try {
      const options: SendNotificationOptions = {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
        priority: dto.priority || 'high',
      };

      let result: any;

      switch (dto.targetType) {
        case 'token':
          if (!dto.targetValue) {
            throw new Error('Target value (FCM token) is required');
          }
          options.token = dto.targetValue;
          result = await fcmService.sendToToken(options);
          break;

        case 'topic':
          if (!dto.targetValue) {
            throw new Error('Target value (topic name) is required');
          }
          options.topic = dto.targetValue;
          result = await fcmService.sendToTopic(options);
          break;

        case 'condition':
          if (!dto.targetValue) {
            throw new Error('Target value (condition) is required');
          }
          options.condition = dto.targetValue;
          result = await fcmService.sendToCondition(options);
          break;

        case 'broadcast':
          // Get all active owner tokens for this tenant
          const tokens = await this.tokenRepository.findOwnerTokensByTenant(dto.tenantId);
          if (tokens.length === 0) {
            throw new Error('No active tokens found for broadcast');
          }
          options.tokens = tokens.map((t) => t.fcmToken);
          result = await fcmService.sendToTokens(options);
          break;

        default:
          throw new Error(`Invalid target type: ${dto.targetType}`);
      }

      // Mark as sent
      await this.messageRepository.markAsSent(message.id, result);
      console.log(`✅ Notification sent successfully: ${message.id}`);

      return message;
    } catch (error: any) {
      // Mark as failed
      await this.messageRepository.markAsFailed(message.id, error.message);
      console.error(`❌ Failed to send notification: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Use Case: Broadcast to All Owners
 */
export class BroadcastToOwnersUseCase {
  constructor(
    private messageRepository: PushNotificationMessageRepository,
    private tokenRepository: PushNotificationTokenRepository
  ) {}

  async execute(dto: BroadcastToOwnersDTO): Promise<PushNotificationMessage> {
    // Get all owner tokens
    const tokens = await this.tokenRepository.findOwnerTokensByTenant(dto.tenantId);

    if (tokens.length === 0) {
      throw new Error('No active owner tokens found for this tenant');
    }

    // Create message record
    const message = await this.messageRepository.create({
      tenantId: dto.tenantId,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      imageUrl: dto.imageUrl,
      targetType: 'broadcast',
      targetValue: `${tokens.length} owners`,
      category: dto.category,
      eventType: dto.eventType,
      priority: 'high',
    });

    try {
      // Send to all owner tokens
      const result = await fcmService.sendToTokens({
        tokens: tokens.map((t) => t.fcmToken),
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
        priority: 'high',
      });

      await this.messageRepository.markAsSent(message.id, result);
      console.log(
        `✅ Broadcast sent to ${result.successCount}/${tokens.length} owners for tenant ${dto.tenantId}`
      );

      return message;
    } catch (error: any) {
      await this.messageRepository.markAsFailed(message.id, error.message);
      console.error(`❌ Failed to broadcast to owners: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Use Case: Subscribe to Topic
 */
export class SubscribeToTopicUseCase {
  constructor(
    private subscriptionRepository: PushNotificationSubscriptionRepository,
    private tokenRepository: PushNotificationTokenRepository
  ) {}

  async execute(dto: SubscribeToTopicDTO): Promise<void> {
    // Find the token
    const token = await this.tokenRepository.findByFcmToken(dto.tokenId);
    
    if (!token) {
      throw new Error('Token not found');
    }

    // Subscribe in FCM
    await fcmService.subscribeToTopic({
      tokens: [token.fcmToken],
      topic: dto.topic,
    });

    // Record subscription
    await this.subscriptionRepository.subscribe({
      tenantId: dto.tenantId,
      tokenId: token.id,
      topic: dto.topic,
    });

    console.log(`✅ Subscribed to topic ${dto.topic}`);
  }
}

/**
 * Use Case: Unsubscribe from Topic
 */
export class UnsubscribeFromTopicUseCase {
  constructor(
    private subscriptionRepository: PushNotificationSubscriptionRepository,
    private tokenRepository: PushNotificationTokenRepository
  ) {}

  async execute(tokenId: string, topic: string): Promise<void> {
    // Find the token
    const token = await this.tokenRepository.findByFcmToken(tokenId);
    
    if (!token) {
      throw new Error('Token not found');
    }

    // Unsubscribe in FCM
    await fcmService.unsubscribeFromTopic({
      tokens: [token.fcmToken],
      topic,
    });

    // Update subscription record
    await this.subscriptionRepository.unsubscribe(token.id, topic);

    console.log(`✅ Unsubscribed from topic ${topic}`);
  }
}

/**
 * Use Case: Get Notification Statistics
 */
export class GetNotificationStatisticsUseCase {
  constructor(private messageRepository: PushNotificationMessageRepository) {}

  async execute(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    const stats = await this.messageRepository.getStatistics(tenantId, dateFrom, dateTo);
    const successRate = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;

    return {
      ...stats,
      successRate: Math.round(successRate * 100) / 100,
    };
  }
}

/**
 * Use Case: Clean Up Inactive Tokens
 */
export class CleanUpInactiveTokensUseCase {
  constructor(private tokenRepository: PushNotificationTokenRepository) {}

  async execute(days: number = 30): Promise<number> {
    const deleted = await this.tokenRepository.deleteInactiveTokens(days);
    console.log(`✅ Cleaned up ${deleted} inactive tokens older than ${days} days`);
    return deleted;
  }
}
