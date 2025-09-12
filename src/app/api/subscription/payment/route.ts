import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSnapTransaction } from '@/lib/midtrans';

export async function POST(req: Request) {
  try {
    const { tenantId, planId, durationInMonth } = await req.json();

    if (!tenantId || !planId || !durationInMonth) {
      return NextResponse.json({ error: 'tenantId, planId, and durationInMonth are required' }, { status: 400 });
    }

    // Use a single database query to fetch both tenant and plan concurrently
    const [tenant, plan] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!tenant || !plan) {
      return NextResponse.json({ error: 'Tenant or plan not found' }, { status: 404 });
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationInMonth);

    // Calculate amount cleanly with a ternary operator
    const amount = durationInMonth === 12
      ? plan.pricePerYear?.toNumber() ?? plan.pricePerMonth.toNumber() * 12
      : plan.pricePerMonth.toNumber() * durationInMonth;

    const orderId = `MDID-${Date.now()}`;

    // Use a single transaction to ensure atomicity
    const { snapToken } = await prisma.$transaction(async (tx) => {
      // Create tenant subscription history
      const tenantSubscription = await tx.tenantSubscriptionHistory.create({
        data: {
          tenantId,
          planId,
          startDate: new Date(),
          endDate,
          status: 'pending',
        },
      });

      // Create Midtrans Snap transaction
      const snapToken = await createSnapTransaction({
        midtransOrderId: orderId,
        amount,
        customer: {
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
        },
        items: [{
          id: plan.id,
          price: amount,
          quantity: 1,
          name: plan.name,
        }],
        enabledPayments: ['bca_va'],
      });

      // Create SubscriptionPayment record
      await tx.subscriptionPayment.create({
        data: {
          tenantId,
          tenantSubscriptionHistoryId: tenantSubscription.id,
          midtransOrderId: orderId,
          amount,
          paymentMethod: null,
          transactionStatus: 'pending',
        },
      });

      return { snapToken };
    });

    return NextResponse.json({ snapToken }, { status: 200 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}