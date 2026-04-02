import { Order, CreateOrderData } from '../../domain/entities/Order';
import { 
  OrderRepository, 
  CustomerRepository, 
  NotificationService, 
  SubscriptionLimitService 
} from '../../domain/repositories/OrderRepository';
import { SubscriptionLimitError } from '../../domain/errors/OrderErrors';
import { SendOrderNotificationUseCase, OrderNotificationEvent } from './customer-messaging/SendOrderNotificationUseCase';
import { fixPhoneNumber } from '@/lib/notificationUtils';
import prisma from '@/lib/prisma';

export class CreateOrderUseCase {
  private sendOrderNotificationUseCase?: SendOrderNotificationUseCase;

  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository,
    private notificationService: NotificationService,
    private subscriptionLimitService: SubscriptionLimitService
  ) {}

  private getNotificationUseCase(): SendOrderNotificationUseCase {
    if (!this.sendOrderNotificationUseCase) {
      this.sendOrderNotificationUseCase = new SendOrderNotificationUseCase();
    }
    return this.sendOrderNotificationUseCase;
  }

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

    // Send notification using new messaging system (async, don't block the response)
    // Wrapped in setImmediate to ensure it doesn't block the response
    setImmediate(() => {
      this.sendOrderNotification(order, tenantId).catch(error => {
        console.error('Failed to send order notification:', error);
      });
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
    try {
      console.log('📧 Starting order notification for order:', order.id);
      console.log('Order details:', {
        orderNo: order.orderNo,
        customerId: order.customerId,
        paymentStatus: order.paymentStatus,
        grandTotal: order.grandTotal
      });

      if (!order.customerId) {
        console.log('⚠️ No customerId, skipping notification');
        return;
      }
      
      console.log('Tenant ID: ', tenantId);
      console.log('customer ID: ', order.customerId);

      const customer = await this.customerRepository.findById(order.customerId, tenantId);
      console.log('Customer found:', customer ? { id: customer.id, name: customer.name, phone: customer.phone } : 'null');
      
      if (!customer || !customer.phone) {
        console.log('⚠️ Customer not found or no phone number, skipping notification');
        return;
      }

      // Normalize phone number
      const normalizedPhone = fixPhoneNumber(customer.phone);
      console.log(`📞 Phone normalization: ${customer.phone} → ${normalizedPhone} (length: ${normalizedPhone.length})`);
      
      if (!normalizedPhone || normalizedPhone.length < 10) {
        console.log('⚠️ Invalid phone number after normalization, skipping notification');
        return;
      }

      const variables = {
        customerName: customer.name || 'Customer',
        grandTotal: `Rp${Number(order.grandTotal).toLocaleString('id-ID')}`,
        orderNumber: order.orderNo,
      };

      // Determine event based on payment status
      const event = order.paymentStatus === 'paid' 
        ? OrderNotificationEvent.ORDER_PAID 
        : OrderNotificationEvent.ORDER_CREATED;

      console.log(`📨 Sending ${event} notification to ${normalizedPhone}`);
      console.log('Variables:', variables);

      // Send notification using new messaging system
      const result = await this.getNotificationUseCase().execute({
        tenantId,
        event,
        recipient: normalizedPhone,
        variables,
      });

      if (result.skipped) {
        console.log(`⏭️ Notification skipped: ${result.message}`);
      } else if (!result.success) {
        console.error(`❌ Notification failed: ${result.message}`);
      } else {
        console.log(`✅ Notification sent successfully!`);
      }
    } catch (error) {
      // Log error but don't throw - notifications should never break order operations
      console.error('❌ Error in sendOrderNotification:', error);
    }
  }
}