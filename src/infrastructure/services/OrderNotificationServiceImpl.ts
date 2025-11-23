import { NotificationService } from '../../domain/repositories/OrderRepository';

export class OrderNotificationServiceImpl implements NotificationService {
  async sendOrderNotification(params: {
    tenantId: string;
    event: 'ORDER_CREATED' | 'ORDER_PAID';
    orderId: string;
    variables: {
      phone: string;
      customerName: string;
      grandTotal: string;
    };
  }): Promise<void> {
    try {
      // Dynamically import the notification service to avoid circular dependencies
      const { sendOrderNotification } = await import('@/lib/orderNotificationService');
      
      await sendOrderNotification({
        tenantId: params.tenantId,
        event: params.event,
        orderId: params.orderId,
        variables: params.variables
      });
    } catch (error) {
      // Log but don't throw - notification failures shouldn't break order operations
      console.error('Failed to send order notification:', {
        orderId: params.orderId,
        tenantId: params.tenantId,
        event: params.event,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}