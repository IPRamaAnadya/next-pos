import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      console.log(`Notification sent to tenant ${tenantId}: Subscription expiring in ${Math.ceil(diffDays)} day(s)`);
    } else {
      console.log(`Subscription for tenant ${tenantId} is valid for more than 7 days. No notification sent.`);
    }

    return NextResponse.json({ daysLeft: Math.ceil(diffDays) }, { status: 200 });
  } catch (error) {
    console.log('Error checking subscription duration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
