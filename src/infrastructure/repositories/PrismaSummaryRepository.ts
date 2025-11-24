/**
 * Infrastructure: PrismaSummaryRepository
 * Implements summary data access using Prisma ORM with optimized queries
 */

import prisma from '@/lib/prisma';
import { SummaryRepository } from '@/domain/repositories/SummaryRepository';
import {
  DailyOrderSummary,
  PaymentMethodSummary,
  TodayOrdersSummary,
  TodayExpensesSummary,
  TopCustomersSummary,
  DailyPaymentReceivedSummary,
} from '@/domain/entities/Summary';
import { format } from 'date-fns';

export class PrismaSummaryRepository implements SummaryRepository {
  constructor() {}

  async getDailyOrders(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyOrderSummary[]> {
    // Fetch all data in parallel for date range
    const [orders, expenses, payments] = await Promise.all([
      // Aggregate orders by date
      prisma.order.findMany({
        where: {
          tenantId,
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          paymentStatus: 'paid',
        },
        select: {
          paymentDate: true,
          grandTotal: true,
        },
      }),
      // Aggregate expenses by date
      prisma.expense.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          isShow: true,
        },
        select: {
          createdAt: true,
          amount: true,
        },
      }),
      // Aggregate payments by date
      prisma.order.findMany({
        where: {
          tenantId,
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          paymentStatus: 'paid',
        },
        select: {
          paymentDate: true,
          grandTotal: true,
        },
      }),
    ]);

    // Helper function to get 24-hour period key from timestamp
    // Groups data by 24-hour periods starting from startDate
    // This solves timezone issues where UTC times span two calendar days
    const getPeriodKey = (timestamp: Date): string => {
      const diffMs = timestamp.getTime() - startDate.getTime();
      const dayIndex = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const periodStart = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      return periodStart.toISOString();
    };

    // Group data by 24-hour period starting from startDate
    const dailyData = new Map<string, DailyOrderSummary>();

    // Process orders
    orders.forEach((order) => {
      if (!order.paymentDate) return;
      const dateKey = getPeriodKey(order.paymentDate);
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        totalOrders: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalPaymentsReceived: 0,
        netProfit: 0,
      };
      existing.totalOrders += 1;
      existing.totalRevenue += order.grandTotal?.toNumber() || 0;
      dailyData.set(dateKey, existing);
    });

    // Process expenses
    expenses.forEach((expense) => {
      if (!expense.createdAt) return;
      const dateKey = getPeriodKey(expense.createdAt);
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        totalOrders: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalPaymentsReceived: 0,
        netProfit: 0,
      };
      existing.totalExpenses += expense.amount?.toNumber() || 0;
      dailyData.set(dateKey, existing);
    });

    // Process payments (already included in orders, so same data)
    payments.forEach((payment) => {
      if (!payment.paymentDate) return;
      const dateKey = getPeriodKey(payment.paymentDate);
      const existing = dailyData.get(dateKey);
      if (existing) {
        existing.totalPaymentsReceived += payment.grandTotal?.toNumber() || 0;
      }
    });

    // Calculate net profit for each day
    dailyData.forEach((summary) => {
      summary.netProfit = summary.totalRevenue - summary.totalExpenses;
    });

    // Convert to array and sort by date
    return Array.from(dailyData.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  async getPaymentMethodSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMethodSummary> {
    // Execute queries in parallel for efficiency
    const [paymentBreakdown, expenseBreakdown] = await Promise.all([
      // Group orders by payment method
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          tenantId,
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          paymentStatus: 'paid',
        },
        _sum: {
          grandTotal: true,
        },
      }),
      // Group expenses by payment type
      prisma.expense.groupBy({
        by: ['paymentType'],
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          isShow: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      tenantId,
      dateRange: {
        startDate,
        endDate,
      },
      paymentBreakdown: paymentBreakdown.map((item) => ({
        paymentMethod: item.paymentMethod || 'unknown',
        totalAmount: item._sum.grandTotal?.toNumber() || 0,
      })),
      expenseBreakdown: expenseBreakdown.map((item) => ({
        paymentType: item.paymentType || 'unknown',
        totalAmount: item._sum.amount?.toNumber() || 0,
      })),
    };
  }

  async getTodayOrders(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayOrdersSummary> {
    // Fetch today's paid orders with customer info in single query
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        paymentStatus: 'paid',
      },
      select: {
        grandTotal: true,
        paymentDate: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    const orderList = orders.map((order) => ({
      grandTotal: order.grandTotal?.toNumber() || 0,
      paymentDate: order.paymentDate,
      customerName: order.customer?.name || null,
    }));

    const totalRevenue = orderList.reduce(
      (sum, order) => sum + order.grandTotal,
      0
    );

    return {
      orders: orderList,
      totalOrders: orderList.length,
      totalRevenue,
    };
  }

  async getTodayExpenses(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayExpensesSummary> {
    // Aggregate total expenses for the date range
    const result = await prisma.expense.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        isShow: true,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalAmount: result._sum.amount?.toNumber() || 0,
      date: todayStart,
    };
  }

  async getTopCustomers(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<TopCustomersSummary> {
    // Use groupBy to aggregate customer spending efficiently
    const topCustomersData = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        customerId: { not: null },
        paymentStatus: 'paid',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        grandTotal: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          grandTotal: 'desc',
        },
      },
      take: limit,
    });

    // Fetch customer details in single query to avoid N+1
    const customerIds = topCustomersData
      .map((c) => c.customerId)
      .filter((id): id is string => id !== null);

    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    // Create customer lookup map
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    // Map results with customer details
    const topCustomers = topCustomersData.map((data) => {
      const customer = data.customerId
        ? customerMap.get(data.customerId)
        : null;
      return {
        customerId: data.customerId || '',
        name: customer?.name || 'Unknown',
        email: customer?.email || null,
        phone: customer?.phone || null,
        totalSpent: data._sum.grandTotal?.toNumber() || 0,
        ordersCount: data._count._all,
      };
    });

    return {
      customers: topCustomers,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  async getDailyPaymentReceived(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyPaymentReceivedSummary> {
    // Aggregate total payments received in date range
    const result = await prisma.order.aggregate({
      where: {
        tenantId,
        paymentStatus: 'paid',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        grandTotal: true,
      },
    });

    return {
      totalPaymentReceived: result._sum.grandTotal?.toNumber() || 0,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }
}
