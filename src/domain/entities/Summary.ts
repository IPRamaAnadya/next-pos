/**
 * Domain Entity: Summary
 * Base types for various summary entities used across the application
 */

/**
 * Daily aggregated summary including orders, expenses, and payments
 */
export interface DailyOrderSummary {
  date: string; // YYYY-MM-DD format
  totalOrders: number;
  totalRevenue: number; // Sum of order grand totals
  totalExpenses: number;
  totalPaymentsReceived: number;
  netProfit: number; // totalRevenue - totalExpenses
}

/**
 * Payment method breakdown with order and expense totals
 */
export interface PaymentMethodBreakdown {
  paymentMethod: string;
  totalAmount: number;
}

export interface ExpenseBreakdown {
  paymentType: string;
  totalAmount: number;
}

export interface PaymentMethodSummary {
  tenantId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  paymentBreakdown: PaymentMethodBreakdown[];
  expenseBreakdown: ExpenseBreakdown[];
}

/**
 * Today's orders with customer information
 */
export interface TodayOrder {
  grandTotal: number;
  paymentDate: Date | null;
  customerName: string | null;
}

export interface TodayOrdersSummary {
  orders: TodayOrder[];
  totalOrders: number;
  totalRevenue: number;
}

/**
 * Today's total expenses
 */
export interface TodayExpensesSummary {
  totalAmount: number;
  date: Date;
}

/**
 * Top customer by spending
 */
export interface TopCustomer {
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalSpent: number;
  ordersCount: number;
}

export interface TopCustomersSummary {
  customers: TopCustomer[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Daily payment received summary
 */
export interface DailyPaymentReceivedSummary {
  totalPaymentReceived: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}
