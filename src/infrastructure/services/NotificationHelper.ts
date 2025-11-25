import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import type { BroadcastToOwnersDTO } from '@/domain/entities/PushNotification';

/**
 * Helper service for sending event-based push notifications
 * Integrates with various features like donations, orders, payments, etc.
 */
export class NotificationHelper {
  private controller: PushNotificationController;

  constructor() {
    this.controller = new PushNotificationController();
  }

  /**
   * Notify owners when a new donation is received (pending)
   */
  async notifyDonationReceived(
    tenantId: string,
    donationId: string,
    donorName: string,
    amount: number,
    currency: string = 'IDR'
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '💰 Donasi Baru Diterima',
      body: `${donorName} telah berdonasi ${formattedAmount}. Menunggu konfirmasi pembayaran.`,
      data: {
        type: 'donation',
        donationId,
        status: 'pending',
        amount: amount.toString(),
      },
      category: 'donation',
      eventType: 'donation_pending',
    });

    console.log(`📢 Notification sent: Donation pending for ${donationId}`);
  }

  /**
   * Notify owners when a donation payment is confirmed
   */
  async notifyDonationConfirmed(
    tenantId: string,
    donationId: string,
    donorName: string,
    amount: number,
    currency: string = 'IDR'
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '✅ Donasi Terkonfirmasi',
      body: `Donasi dari ${donorName} sebesar ${formattedAmount} telah terkonfirmasi!`,
      data: {
        type: 'donation',
        donationId,
        status: 'settlement',
        amount: amount.toString(),
      },
      category: 'donation',
      eventType: 'donation_confirmed',
    });

    console.log(`📢 Notification sent: Donation confirmed for ${donationId}`);
  }

  /**
   * Notify owners when a donation payment fails
   */
  async notifyDonationFailed(
    tenantId: string,
    donationId: string,
    donorName: string,
    amount: number,
    currency: string = 'IDR'
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '❌ Donasi Gagal',
      body: `Donasi dari ${donorName} sebesar ${formattedAmount} gagal diproses.`,
      data: {
        type: 'donation',
        donationId,
        status: 'failed',
        amount: amount.toString(),
      },
      category: 'donation',
      eventType: 'donation_failed',
    });

    console.log(`📢 Notification sent: Donation failed for ${donationId}`);
  }

  /**
   * Notify owners when a donation payment expires
   */
  async notifyDonationExpired(
    tenantId: string,
    donationId: string,
    donorName: string,
    amount: number,
    currency: string = 'IDR'
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '⏰ Donasi Kadaluarsa',
      body: `Donasi dari ${donorName} sebesar ${formattedAmount} telah kadaluarsa.`,
      data: {
        type: 'donation',
        donationId,
        status: 'expired',
        amount: amount.toString(),
      },
      category: 'donation',
      eventType: 'donation_expired',
    });

    console.log(`📢 Notification sent: Donation expired for ${donationId}`);
  }

  /**
   * Notify owners about a new order
   */
  async notifyNewOrder(
    tenantId: string,
    orderId: string,
    orderNumber: string,
    totalAmount: number
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(totalAmount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '🛒 Pesanan Baru',
      body: `Order #${orderNumber} - Total: ${formattedAmount}`,
      data: {
        type: 'order',
        orderId,
        orderNumber,
        amount: totalAmount.toString(),
      },
      category: 'order',
      eventType: 'order_created',
    });

    console.log(`📢 Notification sent: New order ${orderNumber}`);
  }

  /**
   * Notify owners about payment received
   */
  async notifyPaymentReceived(
    tenantId: string,
    orderId: string,
    orderNumber: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);

    await this.controller.broadcastToOwners({
      tenantId,
      title: '💳 Pembayaran Diterima',
      body: `Pembayaran ${formattedAmount} untuk Order #${orderNumber} via ${paymentMethod}`,
      data: {
        type: 'payment',
        orderId,
        orderNumber,
        amount: amount.toString(),
        paymentMethod,
      },
      category: 'payment',
      eventType: 'payment_received',
    });

    console.log(`📢 Notification sent: Payment received for ${orderNumber}`);
  }

  /**
   * Notify owners about low stock products
   */
  async notifyLowStock(
    tenantId: string,
    productName: string,
    currentStock: number,
    minStock: number
  ): Promise<void> {
    await this.controller.broadcastToOwners({
      tenantId,
      title: '⚠️ Stok Hampir Habis',
      body: `${productName} tersisa ${currentStock} unit (minimum: ${minStock})`,
      data: {
        type: 'inventory',
        productName,
        currentStock: currentStock.toString(),
        minStock: minStock.toString(),
      },
      category: 'inventory',
      eventType: 'low_stock',
    });

    console.log(`📢 Notification sent: Low stock for ${productName}`);
  }

  /**
   * Notify owners about system updates or announcements
   */
  async notifySystemAnnouncement(
    tenantId: string,
    title: string,
    message: string,
    imageUrl?: string
  ): Promise<void> {
    await this.controller.broadcastToOwners({
      tenantId,
      title,
      body: message,
      imageUrl,
      data: {
        type: 'system',
      },
      category: 'system',
      eventType: 'system_announcement',
    });

    console.log(`📢 Notification sent: System announcement to tenant ${tenantId}`);
  }

  /**
   * Notify owners about subscription expiration
   */
  async notifySubscriptionExpiring(
    tenantId: string,
    daysRemaining: number,
    expiryDate: Date
  ): Promise<void> {
    const formattedDate = expiryDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await this.controller.broadcastToOwners({
      tenantId,
      title: '⚠️ Langganan Akan Berakhir',
      body: `Langganan Anda akan berakhir dalam ${daysRemaining} hari (${formattedDate}). Segera perpanjang!`,
      data: {
        type: 'subscription',
        daysRemaining: daysRemaining.toString(),
        expiryDate: expiryDate.toISOString(),
      },
      category: 'subscription',
      eventType: 'subscription_expiring',
    });

    console.log(`📢 Notification sent: Subscription expiring for tenant ${tenantId}`);
  }

  /**
   * Notify staff about shift reminder
   */
  async notifyShiftReminder(
    tenantId: string,
    staffId: string,
    shiftName: string,
    startTime: Date
  ): Promise<void> {
    const formattedTime = startTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // This would need to be modified to send to specific staff token
    // For now, it's a placeholder showing the pattern
    await this.controller.sendNotification({
      tenantId,
      title: '⏰ Pengingat Shift',
      body: `Shift ${shiftName} akan dimulai pada ${formattedTime}`,
      targetType: 'topic',
      targetValue: `staff_${staffId}`,
      data: {
        type: 'shift',
        shiftName,
        startTime: startTime.toISOString(),
      },
      category: 'shift',
      eventType: 'shift_reminder',
    });

    console.log(`📢 Notification sent: Shift reminder for staff ${staffId}`);
  }

  /**
   * Send custom notification to all owners
   */
  async sendCustomNotification(dto: BroadcastToOwnersDTO): Promise<void> {
    await this.controller.broadcastToOwners({
      ...dto,
      category: dto.category || 'custom',
      eventType: dto.eventType || 'custom_notification',
    });

    console.log(`📢 Custom notification sent to tenant ${dto.tenantId}`);
  }
}

export const notificationHelper = new NotificationHelper();
