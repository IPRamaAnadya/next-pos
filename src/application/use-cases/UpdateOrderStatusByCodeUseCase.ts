import { Order } from '../../domain/entities/Order';
import { OrderRepository, NotificationService, CustomerRepository } from '../../domain/repositories/OrderRepository';
import { OrderValidationError, OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { SendOrderNotificationUseCase, OrderNotificationEvent } from './customer-messaging/SendOrderNotificationUseCase';
import { fixPhoneNumber } from '@/lib/notificationUtils';
import prisma from '@/lib/prisma';

export interface UpdateOrderStatusByCodeRequest {
  statusCode: string;
}

export class UpdateOrderStatusByCodeUseCase {
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

  async execute(
    tenantId: string,
    orderId: string,
    request: UpdateOrderStatusByCodeRequest
  ): Promise<Order> {
    // Validate input
    if (!request.statusCode || request.statusCode.trim() === '') {
      throw new OrderValidationError('Status code is required', ['statusCode']);
    }

    // Get order to verify it exists
    const existingOrder = await this.orderRepository.findById(orderId, tenantId);
    if (!existingOrder) {
      throw new OrderNotFoundError(`Order with ID ${orderId} not found`);
    }

    // Get the status by code from database
    const orderStatus = await prisma.orderStatus.findUnique({
      where: { 
        tenantId_code: {
          tenantId: tenantId,
          code: request.statusCode
        }
      },
    });

    if (!orderStatus) {
      throw new OrderValidationError(
        `Order status with code '${request.statusCode}' not found`,
        ['statusCode']
      );
    }

    // Create update data with all existing order fields plus the new status
    const updateData = {
      customerName: existingOrder.customerName,
      customerId: existingOrder.customerId || null,
      discountId: existingOrder.discountId || null,
      discountName: existingOrder.discountName || null,
      discountType: (existingOrder.discountType || null) as any,
      discountRewardType: (existingOrder.discountRewardType || null) as any,
      discountValue: existingOrder.discountValue || null,
      discountAmount: existingOrder.discountAmount || null,
      subtotal: existingOrder.subtotal,
      taxAmount: existingOrder.taxAmount,
      totalAmount: existingOrder.totalAmount,
      grandTotal: existingOrder.grandTotal,
      pointUsed: existingOrder.pointUsed || null,
      paidAmount: existingOrder.paidAmount,
      change: existingOrder.change || 0,
      paymentMethod: existingOrder.paymentMethod || null,
      paymentStatus: existingOrder.paymentStatus,
      orderStatus: orderStatus.code, // This is the key change
      staffId: existingOrder.staffId,
      note: existingOrder.note || null,
      orderItems: existingOrder.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        qty: item.qty,
      })),
      id: orderId,
    };

    // Update the order with the resolved status
    const updatedOrder = await this.orderRepository.update(
      orderId,
      updateData as any,
      tenantId
    );

    if (!updatedOrder) {
      throw new OrderNotFoundError(`Failed to update order ${orderId}`);
    }

    // Create an audit log entry for the status change (fire and forget)
    setImmediate(async () => {
      try {
        const result = await (prisma as any).orderLog.create({
          data: {
            orderId: orderId,
            status: orderStatus.name,
            note: `Status updated to ${orderStatus.name}`,
          },
        });
        console.log('✅ Order log created:', result.id);
      } catch (error) {
        console.error('Failed to create order log:', error);
      }
    });

    // Send notification to customer asynchronously (fire and forget)
    setImmediate(() => {
      this.sendOrderNotification(updatedOrder, existingOrder, orderStatus.name, tenantId).catch(error => {
        console.error('Failed to send order notification:', error);
      });
    });

    return updatedOrder;
  }

  private async sendOrderNotification(
    order: Order,
    existingOrder: Order,
    newStatus: string,
    tenantId: string
  ): Promise<void> {
    try {
      console.log('📧 Starting order notification for status update:', order.id);

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
        orderStatus: newStatus,
      };

      // Determine event based on the new status
      let event: OrderNotificationEvent;
      
      if (newStatus === 'completed') {
        event = OrderNotificationEvent.ORDER_COMPLETED;
      } else if (newStatus === 'cancelled') {
        event = OrderNotificationEvent.ORDER_CANCELLED;
      } else {
        // For other status changes, use ORDER_UPDATED
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
