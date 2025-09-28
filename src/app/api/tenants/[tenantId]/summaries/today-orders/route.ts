import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({
        meta: {
          code: 403,
          status: 'error',
          message: 'Unauthorized: Tenant ID mismatch',
        },
        data: [],
      }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Get today's orders with customer info
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: today,
          lt: tomorrow,
        },
        paymentStatus: 'paid',
      },
      include: {
        customer: true,
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    const data = orders.map(order => ({
      grand_total: order.grandTotal?.toNumber?.() ?? (typeof order.grandTotal === 'number' ? order.grandTotal : 0),
      payment_date: order.paymentDate ? order.paymentDate.toISOString() : null,
      customer_name: order.customer?.name || null,
    }));

    return NextResponse.json({
      data,
      meta: {
        code: 200,
        status: 'success',
        message: 'Today orders retrieved successfully',
      },
    });
  } catch (error) {
    console.error('Error fetching today orders:', error);
    return NextResponse.json({
      meta: {
        code: 500,
        status: 'error',
        message: 'Internal server error',
      },
      data: [],
    }, { status: 500 });
  }
}
