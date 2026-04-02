/**
 * Push Notification Token Entity
 * Represents an FCM token registered for a user or staff member
 */
export interface PushNotificationToken {
  id: string;
  tenantId: string;
  userId?: string | null;
  staffId?: string | null;
  fcmToken: string;
  deviceType?: string | null;
  deviceId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
}

/**
 * Push Notification Message Entity
 * Represents a notification message sent via FCM
 */
export interface PushNotificationMessage {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  data?: any;
  imageUrl?: string | null;
  
  // Targeting
  targetType: 'token' | 'topic' | 'condition' | 'broadcast';
  targetValue?: string | null;
  
  // Categorization
  category?: string | null;
  eventType?: string | null;
  
  // Status
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date | null;
  failedAt?: Date | null;
  
  // Response
  fcmResponse?: any;
  error?: string | null;
  
  // Retry
  retryCount: number;
  maxRetries: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Push Notification Subscription Entity
 * Represents a token's subscription to a topic
 */
export interface PushNotificationSubscription {
  id: string;
  tenantId: string;
  tokenId: string;
  topic: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for registering a new FCM token
 */
export interface RegisterTokenDTO {
  tenantId: string;
  userId?: string;
  staffId?: string;
  fcmToken: string;
  deviceType?: string;
  deviceId?: string;
}

/**
 * DTO for sending a push notification
 */
export interface SendNotificationDTO {
  tenantId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  targetType: 'token' | 'topic' | 'condition' | 'broadcast';
  targetValue?: string; // FCM token, topic name, or condition string
  category?: string;
  eventType?: string;
  priority?: 'high' | 'normal';
}

/**
 * DTO for subscribing to a topic
 */
export interface SubscribeToTopicDTO {
  tenantId: string;
  tokenId: string;
  topic: string;
}

/**
 * DTO for broadcast notification to all owners
 */
export interface BroadcastToOwnersDTO {
  tenantId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  category?: string;
  eventType?: string;
}
