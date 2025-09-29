import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { getUtcFromLocal, getUtcStartOfCurrentDay, toUtcFromTz } from '@/lib/dateTz';

export async function GET(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
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

    const clientTimeZone = req.headers.get('X-Timezone-Name') || 'Asia/Makassar';

    

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date')
      ? toUtcFromTz(searchParams.get('start_date')! + 'T00:00:00', clientTimeZone)
      : getUtcStartOfCurrentDay(clientTimeZone);

    const endDate = searchParams.get('end_date')
      ? toUtcFromTz(searchParams.get('end_date')! + 'T00:00:00', clientTimeZone)
      : getUtcFromLocal(clientTimeZone);

    // extend by 1 day for inclusive range
    const queryEndDate = new Date(endDate);
    queryEndDate.setDate(queryEndDate.getDate() + 1);

    // --- Orders grouped by createdAt for general stats ---
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: queryEndDate },
      },
      select: {
        grandTotal: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        paymentDate: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // --- Expenses grouped by createdAt ---
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lt: queryEndDate },
      },
      select: { amount: true, paymentType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // --- Payments received grouped by paymentDate for paid orders only ---
    const payments = await prisma.order.findMany({
      where: {
        tenantId,
        paymentStatus: 'paid',
        paymentDate: { gte: startDate, lte: queryEndDate },
      },
      select: { grandTotal: true, paymentMethod: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    const dailyData: Record<string, any> = {};

    // Orders aggregation
    orders.forEach((order) => {
      const dateKey = order.createdAt!.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total_ordered: 0,
          total_paid: 0,
          total_unpaid: 0,
          payment_received: 0,
          payment_received_non_cash: 0,
          expense: [],
        };
      }

      const total = order.grandTotal?.toNumber() || 0;
      dailyData[dateKey].total_ordered += total;

      if (order.paymentStatus === 'paid') {
        dailyData[dateKey].total_paid += total;
      } else {
        dailyData[dateKey].total_unpaid += total;
      }
    });

    // Expenses aggregation
    expenses.forEach((exp) => {
      const dateKey = exp.createdAt!.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total_ordered: 0,
          total_paid: 0,
          total_unpaid: 0,
          payment_received: 0,
          payment_received_non_cash: 0,
          expense: [],
        };
      }
      dailyData[dateKey].expense.push({
        payment_type: exp.paymentType,
        amount: exp.amount?.toNumber() || 0,
      });
    });

    // Payment received aggregation based on paymentDate
    payments.forEach((pay) => {
      const dateKey = pay.paymentDate?.toISOString().split('T')[0];
      if (!dateKey) return;

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total_ordered: 0,
          total_paid: 0,
          total_unpaid: 0,
          payment_received: 0,
          payment_received_non_cash: 0,
          expense: [],
        };
      }

      const total = pay.grandTotal?.toNumber() || 0;
      dailyData[dateKey].payment_received += total;
      if (pay.paymentMethod?.toLowerCase() !== 'cash') {
        dailyData[dateKey].payment_received_non_cash += total;
      }
    });

    const dailyTransactions = Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Total summary with daily values
    const totalSummary = dailyTransactions.reduce(
      (acc, curr, idx) => {
        acc.total_ordered_sum += curr.total_ordered;
        acc.total_paid_sum += curr.total_paid;
        acc.total_unpaid_sum += curr.total_unpaid;
        acc.total_payment_received_sum += curr.payment_received;
        acc.total_payment_received_non_cash += curr.payment_received_non_cash;
        acc.total_expense_sum += curr.expense.reduce(
          (sum: number, e: any) => sum + e.amount,
          0
        );

        // last day snapshot
        if (idx === dailyTransactions.length - 1) {
          acc.daily_payment_received = curr.payment_received;
          acc.daily_payment_received_non_cash =
            curr.payment_received_non_cash;
        }

        return acc;
      },
      {
        total_ordered_sum: 0,
        total_paid_sum: 0,
        total_unpaid_sum: 0,
        total_payment_received_sum: 0,
        total_payment_received_non_cash: 0,
        total_expense_sum: 0,
        daily_payment_received: 0,
        daily_payment_received_non_cash: 0,
      }
    );

    const finalData = {
      meta: {
        code: 200,
        status: 'success',
        message: 'Financial data retrieved successfully',
      },
      data: {
        id: `FIN_REPORT_${new Date().getFullYear()}${
          Math.floor(new Date().getMonth() / 3) + 1
        }`,
        report_type: 'daily_financials',
        generated_at: new Date(),
        date_range: {
          start: startDate,
          end: endDate,
        },
        summary: totalSummary,
        daily_transactions: dailyTransactions,
      },
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Error fetching daily order summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
