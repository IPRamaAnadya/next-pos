/**
 * UpdateNotificationSettingsUseCase
 * Use case for updating tenant notification settings
 */

import prisma from '@/lib/prisma';

export interface UpdateNotificationSettingsInput {
  tenantId: string;
  enableOrderCreated?: boolean;
  enableOrderUpdated?: boolean;
  enableOrderPaid?: boolean;
  enableOrderCompleted?: boolean;
  enableOrderCancelled?: boolean;
  orderCreatedTemplateId?: string | null;
  orderUpdatedTemplateId?: string | null;
  orderPaidTemplateId?: string | null;
  orderCompletedTemplateId?: string | null;
  orderCancelledTemplateId?: string | null;
}

export class UpdateNotificationSettingsUseCase {
  constructor() {}

  async execute(input: UpdateNotificationSettingsInput) {
    const { tenantId, ...data } = input;

    const config = await prisma.tenantNotificationConfig.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        provider: "fonnte",
        apiToken: "",
        apiUrl: "https://api.fonnte.com/send",
        isActive: false,
        ...data,
      },
    });

    return config;
  }
}
