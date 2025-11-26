// app/api/data/tenants/[tenantId]/summaries/payment-method/route.ts
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
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    // Tambahkan 1 hari untuk menyertakan data dari hari terakhir
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

    // 1. Ambil ringkasan metode pembayaran
    const paymentBreakdown = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _sum: {
        grandTotal: true,
      },
      where: {
        tenantId: tenantId,
        paymentDate: {
          gte: startDate,
          lt: adjustedEndDate,
        },
      },
    });

    // 2. Ambil ringkasan pengeluaran
    const expenseSummary = await prisma.expense.groupBy({
      by: ['paymentType'],
      _sum: {
        amount: true,
      },
      where: {
        tenantId: tenantId,
        isShow: true,
        createdAt: {
          gte: startDate,
          lt: adjustedEndDate,
        },
      },
    });

    // 3. Format hasil untuk respons JSON
    const paymentBreakdownFormatted = paymentBreakdown.map(item => ({
      payment_method: item.paymentMethod,
      total_grand_total: item._sum.grandTotal?.toNumber() || 0,
    }));

    const expenseSummaryFormatted = expenseSummary.map(item => ({
      payment_type: item.paymentType,
      amount: item._sum.amount?.toNumber() || 0,
    }));

    return NextResponse.json({
        meta: {
            code: 200,
            status: 'success',
            message: 'Payment method summary retrieved successfully',
        },
        data: {
            tenant_id: tenantId,
            date_range: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
            },
            payment_breakdown: paymentBreakdownFormatted,
            expense: expenseSummaryFormatted,
        }
    });

  } catch (error) {
    console.error('Error fetching payment method summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}