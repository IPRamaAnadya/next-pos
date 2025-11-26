import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/subscription/history?tenantId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  }

  try {
    // Get all subscription history for the tenant, including payments
    const histories = await prisma.tenantSubscriptionHistory.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
      include: {
        subscriptionPlan: true,
        subscriptionPayments: true,
      },
    });
    return NextResponse.json({ data: histories });
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
