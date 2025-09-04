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
    endDate.setDate(endDate.getDate() + 1);
    // 1. Ambil semua data orders
    const allOrders = await prisma.order.findMany({
      where: {
        tenantId: tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        grandTotal: true,
        paymentStatus: true,
        paymentDate: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Ambil semua data expenses
    const allExpenses = await prisma.expense.findMany({
      where: {
        tenantId: tenantId,
        isShow: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paymentType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Gabungkan dan agregasi data di memori
    const dailyData: { [key: string]: any } = {};

    allOrders.forEach(order => {
      const dateKey = order.createdAt?.toISOString().split('T')[0];
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

      dailyData[dateKey].total_ordered += order.grandTotal?.toNumber() || 0;

      if (order.paymentStatus === 'paid') {
        if (order.paymentDate) {
          dailyData[dateKey].payment_received += order.grandTotal?.toNumber() || 0;
          if (order.paymentMethod?.toLowerCase() !== 'cash') {
            dailyData[dateKey].payment_received_non_cash += order.grandTotal?.toNumber() || 0;
          }
        }
        dailyData[dateKey].total_paid += order.grandTotal?.toNumber() || 0;
      } else {
        dailyData[dateKey].total_unpaid += order.grandTotal?.toNumber() || 0;
      }
    });

    allExpenses.forEach(expense => {
      const dateKey = expense.createdAt?.toISOString().split('T')[0];
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

      dailyData[dateKey].expense.push({
        payment_type: expense.paymentType,
        amount: expense.amount.toNumber() || 0,
      });
    });

    // 4. Hitung ringkasan total
    const dailyTransactions = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalSummary = dailyTransactions.reduce((acc, curr) => {
      acc.total_ordered_sum += curr.total_ordered;
      acc.total_paid_sum += curr.total_paid;
      acc.total_unpaid_sum += curr.total_unpaid;
      acc.total_payment_received_sum += curr.payment_received;
      acc.total_payment_received_non_cash += curr.payment_received_non_cash;
      return acc;
    }, {
      total_ordered_sum: 0,
      total_paid_sum: 0,
      total_unpaid_sum: 0,
      total_payment_received_sum: 0,
      total_payment_received_non_cash: 0,
    });

    const dailyPaymentReceivedToday = allOrders.filter(o => o.paymentStatus === 'paid' && o.paymentDate?.toISOString().split('T')[0] === new Date().toISOString().split('T')[0])
      .reduce((acc, curr) => {
        const grandTotal = curr.grandTotal?.toNumber() || 0;
        acc.daily_payment_received += grandTotal;
        if (curr.paymentMethod?.toLowerCase() !== 'cash') {
          acc.daily_payment_received_non_cash += grandTotal;
        }
        return acc;
      }, { daily_payment_received: 0, daily_payment_received_non_cash: 0 });

    const totalExpenseSum = allExpenses.reduce((acc, curr) => acc + (curr.amount?.toNumber() || 0), 0);

    const finalData = {
      meta: {
        code: 200,
        status: 'success',
        message: 'Financial data retrieved successfully'
      },
      data: {
        id: `FIN_REPORT_${new Date().getFullYear()}${Math.floor(new Date().getMonth() / 3) + 1}`,
        report_type: 'daily_financials',
        generated_at: new Date(),
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        summary: {
          total_ordered_sum: totalSummary.total_ordered_sum,
          total_paid_sum: totalSummary.total_paid_sum,
          total_unpaid_sum: totalSummary.total_unpaid_sum,
          total_payment_received_sum: totalSummary.total_payment_received_sum,
          total_payment_received_non_cash: totalSummary.total_payment_received_non_cash,
          daily_payment_received: dailyPaymentReceivedToday.daily_payment_received,
          daily_payment_received_non_cash: dailyPaymentReceivedToday.daily_payment_received_non_cash,
          total_expense_sum: totalExpenseSum,
        },
        daily_transactions: dailyTransactions,
      }
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Error fetching daily order summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}