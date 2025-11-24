/**
 * GetNotificationSettingsUseCase
 * Use case for getting tenant notification settings
 */

import prisma from "@/lib/prisma";

export interface NotificationSettings {
  id: string;
  tenantId: string;
  provider: string;
  apiToken: string;
  apiUrl: string;
  isActive: boolean;
  enableOrderCreated: boolean;
  enableOrderUpdated: boolean;
  enableOrderPaid: boolean;
  enableOrderCompleted: boolean;
  enableOrderCancelled: boolean;
  orderCreatedTemplateId: string | null;
  orderUpdatedTemplateId: string | null;
  orderPaidTemplateId: string | null;
  orderCompletedTemplateId: string | null;
  orderCancelledTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetNotificationSettingsUseCase {
  async execute(tenantId: string): Promise<NotificationSettings | null> {
    const config = await prisma.tenantNotificationConfig.findFirst({
      where: { tenantId },
    });

    return config;
  }
}
