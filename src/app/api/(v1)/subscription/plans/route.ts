import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        name: {
          not: 'Trial',
        },
      },
      orderBy: {
        pricePerMonth: 'asc',
      },
    });
    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
