import type {
  PushNotificationToken,
  PushNotificationMessage,
  PushNotificationSubscription,
  RegisterTokenDTO,
  SendNotificationDTO,
  SubscribeToTopicDTO,
} from '../entities/PushNotification';

/**
 * Repository interface for Push Notification Token operations
 */
export interface PushNotificationTokenRepository {
  /**
   * Register a new FCM token
   */
  registerToken(dto: RegisterTokenDTO): Promise<PushNotificationToken>;

  /**
   * Find token by FCM token string
   */
  findByFcmToken(fcmToken: string): Promise<PushNotificationToken | null>;

  /**
   * Find all active tokens for a tenant
   */
  findActiveTokensByTenant(tenantId: string): Promise<PushNotificationToken[]>;

  /**
   * Find all active tokens for a user
   */
  findActiveTokensByUser(userId: string): Promise<PushNotificationToken[]>;

  /**
   * Find all active tokens for a staff
   */
  findActiveTokensByStaff(staffId: string): Promise<PushNotificationToken[]>;

  /**
   * Find all owner tokens for a tenant (users who own the tenant)
   */
  findOwnerTokensByTenant(tenantId: string): Promise<PushNotificationToken[]>;

  /**
   * Update token last used timestamp
   */
  updateLastUsed(tokenId: string): Promise<void>;

  /**
   * Deactivate a token
   */
  deactivateToken(tokenId: string): Promise<void>;

  /**
   * Delete a token by FCM token string
   */
  deleteByFcmToken(fcmToken: string): Promise<void>;

  /**
   * Delete inactive tokens older than specified days
   */
  deleteInactiveTokens(days: number): Promise<number>;
}

/**
 * Repository interface for Push Notification Message operations
 */
export interface PushNotificationMessageRepository {
  /**
   * Create a new notification message record
   */
  create(dto: SendNotificationDTO): Promise<PushNotificationMessage>;

  /**
   * Update notification status to sent
   */
  markAsSent(id: string, fcmResponse: any): Promise<void>;

  /**
   * Update notification status to failed
   */
  markAsFailed(id: string, error: string): Promise<void>;

  /**
   * Increment retry count
   */
  incrementRetryCount(id: string): Promise<void>;

  /**
   * Find pending notifications for retry
   */
  findPendingForRetry(): Promise<PushNotificationMessage[]>;

  /**
   * Find notifications by tenant
   */
  findByTenant(tenantId: string, limit?: number): Promise<PushNotificationMessage[]>;

  /**
   * Find notifications by category
   */
  findByCategory(tenantId: string, category: string, limit?: number): Promise<PushNotificationMessage[]>;

  /**
   * Get notification statistics
   */
  getStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }>;
}

/**
 * Repository interface for Push Notification Subscription operations
 */
export interface PushNotificationSubscriptionRepository {
  /**
   * Subscribe a token to a topic
   */
  subscribe(dto: SubscribeToTopicDTO): Promise<PushNotificationSubscription>;

  /**
   * Unsubscribe a token from a topic
   */
  unsubscribe(tokenId: string, topic: string): Promise<void>;

  /**
   * Find all subscriptions for a token
   */
  findByToken(tokenId: string): Promise<PushNotificationSubscription[]>;

  /**
   * Find all active subscribers for a topic
   */
  findActiveSubscribersByTopic(tenantId: string, topic: string): Promise<PushNotificationSubscription[]>;

  /**
   * Check if token is subscribed to topic
   */
  isSubscribed(tokenId: string, topic: string): Promise<boolean>;
}
