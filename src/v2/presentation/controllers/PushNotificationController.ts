import {
  RegisterFCMTokenUseCase,
  DeactivateFCMTokenUseCase,
  SendPushNotificationUseCase,
  BroadcastToOwnersUseCase,
  SubscribeToTopicUseCase,
  UnsubscribeFromTopicUseCase,
  GetNotificationStatisticsUseCase,
  CleanUpInactiveTokensUseCase,
} from '@/application/use-cases/PushNotificationUseCases';
import {
  PrismaPushNotificationTokenRepository,
  PrismaPushNotificationMessageRepository,
  PrismaPushNotificationSubscriptionRepository,
} from '@/infrastructure/repositories/PrismaPushNotificationRepository';
import type {
  RegisterTokenDTO,
  SendNotificationDTO,
  SubscribeToTopicDTO,
  BroadcastToOwnersDTO,
} from '@/domain/entities/PushNotification';

/**
 * Controller for Push Notification operations
 */
export class PushNotificationController {
  private tokenRepository: PrismaPushNotificationTokenRepository;
  private messageRepository: PrismaPushNotificationMessageRepository;
  private subscriptionRepository: PrismaPushNotificationSubscriptionRepository;

  constructor() {
    this.tokenRepository = new PrismaPushNotificationTokenRepository();
    this.messageRepository = new PrismaPushNotificationMessageRepository();
    this.subscriptionRepository = new PrismaPushNotificationSubscriptionRepository();
  }

  /**
   * Register a new FCM token for a user or staff
   */
  async registerToken(dto: RegisterTokenDTO) {
    const useCase = new RegisterFCMTokenUseCase(this.tokenRepository);
    return await useCase.execute(dto);
  }

  /**
   * Deactivate an FCM token
   */
  async deactivateToken(fcmToken: string) {
    const useCase = new DeactivateFCMTokenUseCase(this.tokenRepository);
    return await useCase.execute(fcmToken);
  }

  /**
   * Send a push notification
   */
  async sendNotification(dto: SendNotificationDTO) {
    const useCase = new SendPushNotificationUseCase(this.messageRepository, this.tokenRepository);
    return await useCase.execute(dto);
  }

  /**
   * Broadcast notification to all owners of a tenant
   */
  async broadcastToOwners(dto: BroadcastToOwnersDTO) {
    const useCase = new BroadcastToOwnersUseCase(this.messageRepository, this.tokenRepository);
    return await useCase.execute(dto);
  }

  /**
   * Subscribe a token to a topic
   */
  async subscribeToTopic(dto: SubscribeToTopicDTO) {
    const useCase = new SubscribeToTopicUseCase(
      this.subscriptionRepository,
      this.tokenRepository
    );
    return await useCase.execute(dto);
  }

  /**
   * Unsubscribe a token from a topic
   */
  async unsubscribeFromTopic(tokenId: string, topic: string) {
    const useCase = new UnsubscribeFromTopicUseCase(
      this.subscriptionRepository,
      this.tokenRepository
    );
    return await useCase.execute(tokenId, topic);
  }

  /**
   * Get notification statistics for a tenant
   */
  async getStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date) {
    const useCase = new GetNotificationStatisticsUseCase(this.messageRepository);
    return await useCase.execute(tenantId, dateFrom, dateTo);
  }

  /**
   * Get all notifications for a tenant
   */
  async getNotifications(tenantId: string, limit?: number) {
    return await this.messageRepository.findByTenant(tenantId, limit);
  }

  /**
   * Get notifications by category
   */
  async getNotificationsByCategory(tenantId: string, category: string, limit?: number) {
    return await this.messageRepository.findByCategory(tenantId, category, limit);
  }

  /**
   * Get all active tokens for a tenant
   */
  async getActiveTokens(tenantId: string) {
    return await this.tokenRepository.findActiveTokensByTenant(tenantId);
  }

  /**
   * Get all subscriptions for a token
   */
  async getSubscriptions(tokenId: string) {
    return await this.subscriptionRepository.findByToken(tokenId);
  }

  /**
   * Clean up inactive tokens
   */
  async cleanUpInactiveTokens(days: number = 30) {
    const useCase = new CleanUpInactiveTokensUseCase(this.tokenRepository);
    return await useCase.execute(days);
  }
}
