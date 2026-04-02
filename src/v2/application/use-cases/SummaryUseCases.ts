/**
 * Application: Summary Use Cases
 * Business logic for summary operations
 */

import { SummaryRepository } from '@/domain/repositories/SummaryRepository';
import {
  DailyOrderSummary,
  PaymentMethodSummary,
  TodayOrdersSummary,
  TodayExpensesSummary,
  TopCustomersSummary,
  DailyPaymentReceivedSummary,
} from '@/domain/entities/Summary';

export class GetDailyOrdersSummaryUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyOrderSummary[]> {
    return await this.summaryRepository.getDailyOrders(
      tenantId,
      startDate,
      endDate
    );
  }
}

export class GetPaymentMethodSummaryUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMethodSummary> {
    return await this.summaryRepository.getPaymentMethodSummary(
      tenantId,
      startDate,
      endDate
    );
  }
}

export class GetTodayOrdersUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayOrdersSummary> {
    return await this.summaryRepository.getTodayOrders(
      tenantId,
      todayStart,
      todayEnd
    );
  }
}

export class GetTodayExpensesUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    todayStart: Date,
    todayEnd: Date
  ): Promise<TodayExpensesSummary> {
    return await this.summaryRepository.getTodayExpenses(
      tenantId,
      todayStart,
      todayEnd
    );
  }
}

export class GetTopCustomersUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<TopCustomersSummary> {
    return await this.summaryRepository.getTopCustomers(
      tenantId,
      startDate,
      endDate,
      limit
    );
  }
}

export class GetDailyPaymentReceivedUseCase {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyPaymentReceivedSummary> {
    return await this.summaryRepository.getDailyPaymentReceived(
      tenantId,
      startDate,
      endDate
    );
  }
}
