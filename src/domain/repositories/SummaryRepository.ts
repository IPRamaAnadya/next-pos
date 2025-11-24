/**
 * Repository Interface: SummaryRepository
 * Defines data access methods for summary operations
 */

import {
  DailyOrderSummary,
  PaymentMethodSummary,
  TodayOrdersSummary,
  TodayExpensesSummary,
  TopCustomersSummary,
  DailyPaymentReceivedSummary,
} from '../entities/Summary';

export interface SummaryRepository {
  /**
   * Get daily orders summary aggregated by date
   * @param tenantId - The tenant ID
   * @param startDate - Start date in UTC
   * @param endDate - End date in UTC
   * @returns Array of daily summaries
   */
  getDailyOrders(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyOrderSummary[]>;

  /**
   * Get payment method breakdown summary
   * @param tenantId - The tenant ID
   * @param startDate - Start date in UTC
   * @param endDate - End date in UTC
   * @returns Payment method summary with order and expense breakdowns
   */
  getPaymentMethodSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMethodSummary>;

  /**
   * Get today's orders with customer information
   * @param tenantId - The tenant ID
   * @param todayStart - Start of today in UTC
   * @param todayEnd - End of today in UTC
   * @returns Today's orders summary
   */
  getTodayOrders(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayOrdersSummary>;

  /**
   * Get today's total expenses
   * @param tenantId - The tenant ID
   * @param todayStart - Start date in UTC
   * @param todayEnd - End date in UTC
   * @returns Today's expenses summary
   */
  getTodayExpenses(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayExpensesSummary>;

  /**
   * Get top customers by spending
   * @param tenantId - The tenant ID
   * @param startDate - Start date in UTC
   * @param endDate - End date in UTC
   * @param limit - Maximum number of customers to return
   * @returns Top customers summary
   */
  getTopCustomers(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<TopCustomersSummary>;

  /**
   * Get daily payment received summary
   * @param tenantId - The tenant ID
   * @param startDate - Start date in UTC
   * @param endDate - End date in UTC
   * @returns Daily payment received summary
   */
  getDailyPaymentReceived(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyPaymentReceivedSummary>;
}
