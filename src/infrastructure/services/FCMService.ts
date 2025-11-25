import { firebaseAdmin } from '@/lib/firebase-admin';
import type { Message, MulticastMessage, BatchResponse } from 'firebase-admin/messaging';

export interface SendNotificationOptions {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  channelId?: string;
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
}

export interface TopicSubscriptionOptions {
  tokens: string[];
  topic: string;
}

/**
 * FCM Service for sending push notifications
 * Supports sending to individual tokens, multiple tokens, topics, and conditions
 */
export class FCMService {
  /**
   * Send notification to a single token
   */
  async sendToToken(options: SendNotificationOptions): Promise<string> {
    if (!options.token) {
      throw new Error('Token is required for sendToToken');
    }

    const message: Message = {
      ...this.buildMessage(options),
      token: options.token,
    };

    try {
      const messageId = await firebaseAdmin.getMessaging().send(message);
      console.log('✅ Successfully sent message to token:', messageId);
      return messageId;
    } catch (error: any) {
      console.error('❌ Error sending message to token:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Send notification to multiple tokens (multicast)
   */
  async sendToTokens(options: SendNotificationOptions): Promise<BatchResponse> {
    if (!options.tokens || options.tokens.length === 0) {
      throw new Error('Tokens array is required for sendToTokens');
    }

    const message: MulticastMessage = {
      ...this.buildMessage(options),
      tokens: options.tokens,
    };

    try {
      const response = await firebaseAdmin.getMessaging().sendEachForMulticast(message);
      console.log(`✅ Successfully sent multicast message. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      // Log failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(options.tokens![idx]);
            console.error(`Failed token ${options.tokens![idx]}: ${resp.error?.message}`);
          }
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error sending multicast message:', error);
      throw new Error(`Failed to send multicast notification: ${error.message}`);
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(options: SendNotificationOptions): Promise<string> {
    if (!options.topic) {
      throw new Error('Topic is required for sendToTopic');
    }

    const message: Message = {
      ...this.buildMessage(options),
      topic: options.topic,
    };

    try {
      const messageId = await firebaseAdmin.getMessaging().send(message);
      console.log('✅ Successfully sent message to topic:', options.topic, messageId);
      return messageId;
    } catch (error: any) {
      console.error('❌ Error sending message to topic:', error);
      throw new Error(`Failed to send notification to topic: ${error.message}`);
    }
  }

  /**
   * Send notification to a condition
   */
  async sendToCondition(options: SendNotificationOptions): Promise<string> {
    if (!options.condition) {
      throw new Error('Condition is required for sendToCondition');
    }

    const message: Message = {
      ...this.buildMessage(options),
      condition: options.condition,
    };

    try {
      const messageId = await firebaseAdmin.getMessaging().send(message);
      console.log('✅ Successfully sent message to condition:', options.condition, messageId);
      return messageId;
    } catch (error: any) {
      console.error('❌ Error sending message to condition:', error);
      throw new Error(`Failed to send notification to condition: ${error.message}`);
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(options: TopicSubscriptionOptions): Promise<void> {
    try {
      const response = await firebaseAdmin.getMessaging().subscribeToTopic(
        options.tokens,
        options.topic
      );
      console.log(`✅ Successfully subscribed to topic ${options.topic}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      if (response.failureCount > 0) {
        response.errors.forEach((err: any, idx: number) => {
          console.error(`Failed to subscribe token ${options.tokens[idx]}: ${err.error.message}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Error subscribing to topic:', error);
      throw new Error(`Failed to subscribe to topic: ${error.message}`);
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(options: TopicSubscriptionOptions): Promise<void> {
    try {
      const response = await firebaseAdmin.getMessaging().unsubscribeFromTopic(
        options.tokens,
        options.topic
      );
      console.log(`✅ Successfully unsubscribed from topic ${options.topic}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      if (response.failureCount > 0) {
        response.errors.forEach((err: any, idx: number) => {
          console.error(`Failed to unsubscribe token ${options.tokens[idx]}: ${err.error.message}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Error unsubscribing from topic:', error);
      throw new Error(`Failed to unsubscribe from topic: ${error.message}`);
    }
  }

  /**
   * Build FCM message from options
   */
  private buildMessage(options: SendNotificationOptions): Omit<Message, 'token' | 'topic' | 'condition'> {
    const message: Omit<Message, 'token' | 'topic' | 'condition'> = {
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data,
      android: {
        priority: options.priority === 'high' ? 'high' : 'normal',
        ttl: options.ttl ? options.ttl * 1000 : undefined, // Convert to milliseconds
        notification: {
          channelId: options.channelId,
          imageUrl: options.imageUrl,
        },
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
          },
        },
        fcmOptions: {
          imageUrl: options.imageUrl,
        },
      },
      webpush: options.imageUrl
        ? {
            notification: {
              image: options.imageUrl,
            },
          }
        : undefined,
    };

    return message;
  }

  /**
   * Validate FCM token format
   */
  isValidToken(token: string): boolean {
    // FCM tokens are typically 152-163 characters long
    return token.length >= 100 && /^[A-Za-z0-9_-]+$/.test(token);
  }
}

export const fcmService = new FCMService();
