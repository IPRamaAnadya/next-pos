import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId } = await params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: Tenant ID mismatch' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 20);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    // Default date range
    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1); // awal bulan
    startDate.setHours(0, 0, 0, 0);

    const endDate = endDateParam ? new Date(endDateParam) : now;
    endDate.setHours(23, 59, 59, 999);

    // Query langsung pakai groupBy
    const topCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        customerId: { not: null },
        paymentStatus: 'paid',
        OR: [
          { paymentDate: { gte: startDate, lte: endDate } }
        ],
      },
      _sum: {
        grandTotal: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: { grandTotal: 'desc' },
      },
      take: limit,
    });

    // Ambil info customer (biar lebih informatif)
    const customerIds = topCustomers.map(c => c.customerId as string);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, phone: true },
    });

    const formatted = topCustomers.map(c => {
      const customer = customers.find(cu => cu.id === c.customerId);
      return {
        customerId: c.customerId,
        name: customer?.name || 'Unknown',
        email: customer?.email || null,
        phone: customer?.phone || null,
        totalSpent: c._sum.grandTotal?.toNumber() || 0,
        ordersCount: c._count._all,
      };
    });

    return NextResponse.json({
      meta: {
        code: 200,
        status: 'success',
        message: 'Top customers retrieved successfully',
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
