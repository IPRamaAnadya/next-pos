import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookNotification } from '@/lib/midtrans';

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    
    // Verify the webhook signature to ensure the request is from Midtrans
    const isValid = await verifyWebhookNotification(notification);
    if (!isValid) {
      // Use a 401 Unauthorized status for invalid signatures
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const {
      order_id: orderId,
      transaction_status: transactionStatus,
      payment_type: paymentMethod,
      gross_amount: grossAmount,
    } = notification;

    // Use a Prisma transaction to ensure all database operations are atomic.
    // If any part of the transaction fails, all changes are rolled back.
    await prisma.$transaction(async (tx) => {
      // Step 1: Update the SubscriptionPayment record with the latest status
      const payment = await tx.subscriptionPayment.update({
        where: { midtransOrderId: orderId },
        data: {
          transactionStatus,
          paymentMethod,
          amount: grossAmount,
        },
        // Use `include` to fetch the related tenantSubscriptionHistory in a single query
        include: {
          tenantSubscriptionHistory: true,
        },
      });

      const tenantSubscriptionHistory = payment?.tenantSubscriptionHistory;
      if (!tenantSubscriptionHistory) {
        // This should not happen if the initial payment record was created correctly.
        console.error('Webhook received for non-existent subscription history:', orderId);
        throw new Error('Subscription history not found.');
      }

      // Step 2: Handle only successful transactions (settlement status)
      if (transactionStatus === 'settlement') {
        // Update the subscription history status
        await tx.tenantSubscriptionHistory.update({
          where: { id: tenantSubscriptionHistory.id },
          data: { status: transactionStatus },
        });

        // Step 3: Find the current active subscription for the tenant
        const currentTenantSubscription = await tx.tenantSubscription.findUnique({
          where: { tenantId: tenantSubscriptionHistory.tenantId },
        });

        // Calculate the duration from the history record
        const historyStartDate = tenantSubscriptionHistory.startDate;
        const historyEndDate = tenantSubscriptionHistory.endDate;
        const durationInMonths = (historyEndDate.getFullYear() - historyStartDate.getFullYear()) * 12 + (historyEndDate.getMonth() - historyStartDate.getMonth());

        // Determine the new end date for the main subscription record
        let newEndDate = historyEndDate;
        if (currentTenantSubscription && currentTenantSubscription.status === 'active' && currentTenantSubscription.endDate > new Date()) {
          // If the current subscription is active and not expired, extend its end date
          newEndDate = new Date(currentTenantSubscription.endDate);
          newEndDate.setMonth(newEndDate.getMonth() + durationInMonths);
        }

        // Step 4: Upsert (create or update) the main TenantSubscription record
        await tx.tenantSubscription.upsert({
          where: { tenantId: tenantSubscriptionHistory.tenantId },
          create: {
            tenantId: tenantSubscriptionHistory.tenantId,
            planId: tenantSubscriptionHistory.planId,
            startDate: new Date(),
            endDate: newEndDate,
            status: 'active',
          },
          update: {
            planId: tenantSubscriptionHistory.planId,
            endDate: newEndDate,
            status: 'active',
          },
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
