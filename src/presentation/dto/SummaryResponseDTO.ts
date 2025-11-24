/**
 * Presentation: Summary Response DTOs
 * Maps domain entities to API response format
 */

import {
  DailyOrderSummary,
  PaymentMethodSummary,
  TodayOrdersSummary,
  TodayExpensesSummary,
  TopCustomersSummary,
  DailyPaymentReceivedSummary,
} from '@/domain/entities/Summary';

/**
 * Map daily orders summary to API response
 */
export function mapDailyOrdersSummaryResponse(summaries: DailyOrderSummary[]) {
  return summaries.map((summary) => ({
    date: summary.date,
    total_orders: summary.totalOrders,
    total_revenue: summary.totalRevenue,
    total_expenses: summary.totalExpenses,
    total_payments_received: summary.totalPaymentsReceived,
    net_profit: summary.netProfit,
    total_amount_created: summary.totalAmountCreated,
    total_amount_paid: summary.totalAmountPaid,
    total_amount_unpaid: summary.totalAmountUnpaid,
  }));
}

/**
 * Map payment method summary to API response
 */
export function mapPaymentMethodSummaryResponse(summary: PaymentMethodSummary) {
  return {
    tenant_id: summary.tenantId,
    date_range: {
      start_date: summary.dateRange.startDate.toISOString(),
      end_date: summary.dateRange.endDate.toISOString(),
    },
    payment_breakdown: summary.paymentBreakdown.map((pb) => ({
      payment_method: pb.paymentMethod,
      total_amount: pb.totalAmount,
    })),
    expense_breakdown: summary.expenseBreakdown.map((eb) => ({
      payment_type: eb.paymentType,
      total_amount: eb.totalAmount,
    })),
  };
}

/**
 * Map today's orders summary to API response
 */
export function mapTodayOrdersSummaryResponse(summary: TodayOrdersSummary) {
  return {
    orders: summary.orders.map((order) => ({
      grand_total: order.grandTotal,
      payment_date: order.paymentDate ? order.paymentDate.toISOString() : null,
      customer_name: order.customerName,
    })),
    total_orders: summary.totalOrders,
    total_revenue: summary.totalRevenue,
  };
}

/**
 * Map today's expenses summary to API response
 */
export function mapTodayExpensesSummaryResponse(summary: TodayExpensesSummary) {
  return {
    total_amount: summary.totalAmount,
    date: summary.date.toISOString(),
  };
}

/**
 * Map top customers summary to API response
 */
export function mapTopCustomersSummaryResponse(summary: TopCustomersSummary) {
  return {
    customers: summary.customers.map((customer) => ({
      customer_id: customer.customerId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      total_spent: customer.totalSpent,
      orders_count: customer.ordersCount,
    })),
    date_range: {
      start_date: summary.dateRange.startDate.toISOString(),
      end_date: summary.dateRange.endDate.toISOString(),
    },
  };
}

/**
 * Map daily payment received summary to API response
 */
export function mapDailyPaymentReceivedSummaryResponse(
  summary: DailyPaymentReceivedSummary
) {
  return {
    total_payment_received: summary.totalPaymentReceived,
    date_range: {
      start_date: summary.dateRange.startDate.toISOString(),
      end_date: summary.dateRange.endDate.toISOString(),
    },
  };
}
