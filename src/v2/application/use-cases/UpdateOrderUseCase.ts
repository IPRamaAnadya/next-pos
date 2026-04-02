import { Order, UpdateOrderData } from '../../domain/entities/Order';
import { 
  OrderRepository, 
  CustomerRepository, 
  NotificationService 
} from '../../domain/repositories/OrderRepository';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { SendOrderNotificationUseCase, OrderNotificationEvent } from './customer-messaging/SendOrderNotificationUseCase';
import { fixPhoneNumber } from '@/lib/notificationUtils';
import prisma from '@/lib/prisma';

export class UpdateOrderUseCase {
  private sendOrderNotificationUseCase?: SendOrderNotificationUseCase;

  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository,
    private notificationService: NotificationService
  ) {}

  private getNotificationUseCase(): SendOrderNotificationUseCase {
    if (!this.sendOrderNotificationUseCase) {
      this.sendOrderNotificationUseCase = new SendOrderNotificationUseCase();
    }
    return this.sendOrderNotificationUseCase;
  }

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

    // Send notification using new messaging system (async, don't block the response)
    // Wrapped in setImmediate to ensure it doesn't block the response
    setImmediate(() => {
      this.sendOrderNotification(updatedOrder, existingOrder, tenantId).catch(error => {
        console.error('Failed to send order notification:', error);
      });
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

  private async sendOrderNotification(order: Order, existingOrder: Order, tenantId: string): Promise<void> {
    try {
      console.log('📧 Starting order notification for updated order:', order.id);
      console.log('Order details:', {
        orderNo: order.orderNo,
        customerId: order.customerId,
        paymentStatus: `${existingOrder.paymentStatus} → ${order.paymentStatus}`,
        orderStatus: `${existingOrder.orderStatus} → ${order.orderStatus}`,
        grandTotal: order.grandTotal
      });

      if (!order.customerId) {
        console.log('⚠️ No customerId, skipping notification');
        return;
      }

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

      // Determine event based on what changed
      let event: OrderNotificationEvent;
      
      // Check for order status changes first (completed/cancelled)
      if (order.orderStatus === 'completed' && existingOrder.orderStatus !== 'completed') {
        event = OrderNotificationEvent.ORDER_COMPLETED;
      } else if (order.orderStatus === 'cancelled' && existingOrder.orderStatus !== 'cancelled') {
        event = OrderNotificationEvent.ORDER_CANCELLED;
      } else if (order.paymentStatus === 'paid' && existingOrder.paymentStatus !== 'paid') {
        // Payment status changed to paid
        event = OrderNotificationEvent.ORDER_PAID;
      } else {
        // Order details updated (but not payment or status)
        event = OrderNotificationEvent.ORDER_UPDATED;
      }

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