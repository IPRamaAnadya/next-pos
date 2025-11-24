/**
 * SendOrderNotificationUseCase
 * Use case for sending order-related notifications based on event type
 */

import prisma from "@/lib/prisma";
import { GetNotificationSettingsUseCase } from "./GetNotificationSettingsUseCase";
import { SendMessageWithTemplateUseCase } from "../CustomerMessagingUseCases";
import { PrismaMessageTemplateRepository } from "@/infrastructure/repositories/PrismaMessageTemplateRepository";
import { PrismaMessagingConfigRepository } from "@/infrastructure/repositories/PrismaMessagingConfigRepository";
import { PrismaMessageLogRepository } from "@/infrastructure/repositories/PrismaMessageLogRepository";
import { MessagingProviderFactory } from "@/infrastructure/services/MessagingProviderFactory";
import { MessageStatus } from "@/domain/entities/MessageLog";

export enum OrderNotificationEvent {
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_UPDATED = "ORDER_UPDATED",
  ORDER_PAID = "ORDER_PAID",
  ORDER_COMPLETED = "ORDER_COMPLETED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
}

export interface SendOrderNotificationInput {
  tenantId: string;
  event: OrderNotificationEvent;
  recipient: string; // phone number
  variables: Record<string, string>; // e.g., { customerName, grandTotal, orderNumber }
}

export class SendOrderNotificationUseCase {
  private getSettingsUseCase?: GetNotificationSettingsUseCase;
  private sendMessageUseCase?: SendMessageWithTemplateUseCase;

  private getSettingsUseCaseInstance(): GetNotificationSettingsUseCase {
    if (!this.getSettingsUseCase) {
      this.getSettingsUseCase = new GetNotificationSettingsUseCase();
    }
    return this.getSettingsUseCase;
  }

  private getSendMessageUseCaseInstance(): SendMessageWithTemplateUseCase {
    if (!this.sendMessageUseCase) {
      const templateRepository = PrismaMessageTemplateRepository.getInstance();
      const configRepository = PrismaMessagingConfigRepository.getInstance();
      const logRepository = PrismaMessageLogRepository.getInstance();
      const providerFactory = MessagingProviderFactory.getInstance();
      
      this.sendMessageUseCase = SendMessageWithTemplateUseCase.getInstance(
        logRepository,
        configRepository,
        templateRepository,
        providerFactory
      );
    }
    return this.sendMessageUseCase;
  }

  async execute(input: SendOrderNotificationInput): Promise<{
    success: boolean;
    message?: string;
    skipped?: boolean;
  }> {
    try {
      const { tenantId, event, recipient, variables } = input;

      console.log(`🔔 SendOrderNotificationUseCase: ${event} for ${recipient}`);

      // Get notification settings
      const settings = await this.getSettingsUseCaseInstance().execute(tenantId);

      console.log('Notification settings:', settings ? {
        enableOrderCreated: settings.enableOrderCreated,
        enableOrderPaid: settings.enableOrderPaid,
        enableOrderUpdated: settings.enableOrderUpdated,
        enableOrderCompleted: settings.enableOrderCompleted,
        enableOrderCancelled: settings.enableOrderCancelled,
      } : 'null');

      if (!settings) {
        console.log('❌ No notification settings found');
        return {
          success: false,
          message: "Notification settings not found",
          skipped: true,
        };
      }

      // Check if notification is enabled for this event
      let isEnabled = false;
      let templateId: string | null = null;

      switch (event) {
        case OrderNotificationEvent.ORDER_CREATED:
          isEnabled = settings.enableOrderCreated;
          templateId = settings.orderCreatedTemplateId;
          break;
        case OrderNotificationEvent.ORDER_UPDATED:
          isEnabled = settings.enableOrderUpdated;
          templateId = settings.orderUpdatedTemplateId;
          break;
        case OrderNotificationEvent.ORDER_PAID:
          isEnabled = settings.enableOrderPaid;
          templateId = settings.orderPaidTemplateId;
          break;
        case OrderNotificationEvent.ORDER_COMPLETED:
          isEnabled = settings.enableOrderCompleted;
          templateId = settings.orderCompletedTemplateId;
          break;
        case OrderNotificationEvent.ORDER_CANCELLED:
          isEnabled = settings.enableOrderCancelled;
          templateId = settings.orderCancelledTemplateId;
          break;
      }

      console.log(`Event ${event}: isEnabled=${isEnabled}, templateId=${templateId}`);

      // Skip if not enabled
      if (!isEnabled) {
        console.log(`⏭️ Notification for ${event} is disabled`);
        return {
          success: true,
          message: `Notification for ${event} is disabled`,
          skipped: true,
        };
      }

      // If no specific template, find default template for the event
      if (!templateId) {
        console.log(`🔍 No templateId in settings, searching for default template for event: ${event}`);
        const template = await prisma.notificationTemplate.findFirst({
          where: {
            tenantId,
            event: event as any, // Maps to NotificationEvent enum
            isCustom: false,
          },
        });

        console.log('Default template found:', template ? { id: template.id, name: template.name } : 'null');

        if (template) {
          templateId = template.id;
        }
      }

      // If still no template, skip
      if (!templateId) {
        console.log(`❌ No template found for ${event}`);
        return {
          success: false,
          message: `No template found for ${event}`,
          skipped: true,
        };
      }

      console.log(`✅ Using template: ${templateId}`);

      // Get config to determine provider
      const config = await prisma.tenantNotificationConfig.findFirst({
        where: { tenantId },
      });

      console.log('Notification config:', config ? { provider: config.provider, isActive: config.isActive, apiToken: config.apiToken ? '***' : 'null' } : 'null');

      if (!config || !config.isActive) {
        console.log('❌ Config not found or inactive');
        return {
          success: false,
          message: "Notification config not found or inactive",
          skipped: true,
        };
      }

      console.log(`📤 Sending notification via ${config.provider}...`);

      // Send the notification
      const result = await this.getSendMessageUseCaseInstance().execute({
        tenantId,
        provider: config.provider as any,
        templateId,
        recipient,
        variables,
      });

      console.log('Send result:', { status: result.status, errorMessage: result.errorMessage });

      return {
        success: result.status === MessageStatus.SENT || result.status === MessageStatus.DELIVERED,
        message: result.status === MessageStatus.SENT ? "Notification sent successfully" : result.errorMessage || "Failed to send",
      };
    } catch (error) {
      console.error('SendOrderNotificationUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send notification",
        skipped: true,
      };
    }
  }
}
