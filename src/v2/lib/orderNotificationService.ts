import prisma from '@/lib/prisma';
import { fixPhoneNumber, encodeMessage } from '@/lib/notificationUtils';

export async function sendOrderNotification({ tenantId, event, orderId, variables, templateId }: {
  tenantId: string;
  event?: 'ORDER_CREATED' | 'ORDER_PAID';
  orderId?: string;
  variables: Record<string, string>;
  templateId?: string;
}) {
  // Get notification config
  const config = await prisma.tenantNotificationConfig.findUnique({ where: { tenantId } });
  if (!config || !config.isActive) throw new Error('Notification config not found or inactive');

  // Get template
  let template;
  if (templateId) {
    template = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
  } else if (event) {
    template = await prisma.notificationTemplate.findFirst({
      where: { tenantId, event: event as any },
      orderBy: { isActive: 'desc' }
    });
  }
  if (!template || !template.isActive) throw new Error('Notification template not found or inactive');

  // Prepare message
  let message = template.message;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  const recipientRaw = variables.phone || '';
  const recipient = fixPhoneNumber(recipientRaw);
  const encodedMessage = encodeMessage(message);

  // Send notification (example: Fonnte API)
  if (config.provider === 'fonnte') {
    const url = `${config.apiUrl}?token=${config.apiToken}&target=${recipient}&message=${encodedMessage}`;
    await fetch(url, { method: 'GET' });
  }
  // Add more providers as needed

  console.log(`Notification sent to ${recipient}: ${message}`);

  // Log notification
  await prisma.notificationLog.create({
    data: {
      tenantId,
      templateId: template.id,
      recipient,
      message,
      status: 'success',
      createdAt: new Date()
    }
  });
}
