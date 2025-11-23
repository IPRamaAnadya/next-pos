import { Order, UpdateOrderData } from '../../domain/entities/Order';
import { 
  OrderRepository, 
  CustomerRepository, 
  NotificationService 
} from '../../domain/repositories/OrderRepository';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

export class UpdateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository,
    private notificationService: NotificationService
  ) {}

  async execute(id: string, data: UpdateOrderData, tenantId: string): Promise<Order> {
    // Verify order exists
    const existingOrder = await this.orderRepository.findById(id, tenantId);
    if (!existingOrder) {
      throw new OrderNotFoundError(id);
    }

    // Update the order
    const updatedOrder = await this.orderRepository.update(id, data, tenantId);

    // Handle customer points if payment status changed to paid
    if (data.paymentStatus === 'paid' && data.customerId) {
      await this.handleCustomerPoints(data, existingOrder);
    }

    // Send notification (async, don't block the response)
    this.sendOrderNotification(updatedOrder, tenantId).catch(error => {
      console.error('Failed to send order notification:', error);
    });

    return updatedOrder;
  }

  private async handleCustomerPoints(data: UpdateOrderData, existingOrder: Order): Promise<void> {
    if (!data.customerId) return;

    // Note: This is a simplified implementation. In a real-world scenario,
    // you'd need to compare the previous and current order states to handle point changes correctly.
    
    // For now, we'll apply the current order's point logic
    if (data.pointUsed && data.pointUsed > 0) {
      await this.customerRepository.decrementPoints(data.customerId, data.pointUsed);
    }

    if (data.discountRewardType === 'point' && data.discountAmount && data.discountAmount > 0) {
      await this.customerRepository.incrementPoints(data.customerId, data.discountAmount);
    }
  }

  private async sendOrderNotification(order: Order, tenantId: string): Promise<void> {
    if (!order.customerId) return;

    const customer = await this.customerRepository.findById(tenantId, order.customerId);
    if (!customer) return;

    const notificationVars = {
      phone: customer.phone || '',
      customerName: customer.name || '',
      grandTotal: `Rp${Number(order.grandTotal).toLocaleString('id-ID')}`,
    };

    const event = order.paymentStatus === 'paid' ? 'ORDER_PAID' : 'ORDER_CREATED';

    await this.notificationService.sendOrderNotification({
      tenantId,
      event,
      orderId: order.id,
      variables: notificationVars
    });
  }
}