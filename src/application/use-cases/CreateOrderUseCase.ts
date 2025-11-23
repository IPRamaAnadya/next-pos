import { Order, CreateOrderData } from '../../domain/entities/Order';
import { 
  OrderRepository, 
  CustomerRepository, 
  NotificationService, 
  SubscriptionLimitService 
} from '../../domain/repositories/OrderRepository';
import { SubscriptionLimitError } from '../../domain/errors/OrderErrors';

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository,
    private notificationService: NotificationService,
    private subscriptionLimitService: SubscriptionLimitService
  ) {}

  async execute(data: CreateOrderData, tenantId: string): Promise<Order> {
    // Check subscription limits
    try {
      await this.subscriptionLimitService.enforceLimit(tenantId, 'transaction', 1);
    } catch (error: any) {
      throw new SubscriptionLimitError(error.message);
    }

    // Create the order
    const order = await this.orderRepository.create(data, tenantId);

    // Handle customer points if payment is completed
    if (data.paymentStatus === 'paid' && data.customerId) {
      await this.handleCustomerPoints(data);
    }

    // Send notification (async, don't block the response)
    this.sendOrderNotification(order, tenantId).catch(error => {
      console.error('Failed to send order notification:', error);
    });

    return order;
  }

  private async handleCustomerPoints(data: CreateOrderData): Promise<void> {
    if (!data.customerId) return;

    // Deduct points if used
    if (data.pointUsed && data.pointUsed > 0) {
      await this.customerRepository.decrementPoints(data.customerId, data.pointUsed);
    }

    // Add reward points if applicable
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