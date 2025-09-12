import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotificationByEvent } from '@/lib/fcm';

export async function POST(req: Request) {
  try {
    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get tenant subscription
    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      // Send notification to all devices subscribed to this tenant
      await sendNotificationByEvent(tenantId, {
        notification: {
          title: 'Langganan Akan Segera Berakhir',
          body: `Langganan Anda akan berakhir dalam ${Math.ceil(diffDays)} hari. Silakan perpanjang segera!`,
        },
        data: {
          type: 'subscription_expiring',
          days_left: Math.ceil(diffDays).toString(),
        },
      });
    }

    return NextResponse.json({ daysLeft: Math.ceil(diffDays) }, { status: 200 });
  } catch (error) {
    console.error('Error checking subscription duration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
