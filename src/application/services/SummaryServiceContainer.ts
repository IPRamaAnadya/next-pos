/**
 * Application: SummaryServiceContainer
 * Dependency injection container for summary feature
 */

import { PrismaSummaryRepository } from '@/infrastructure/repositories/PrismaSummaryRepository';
import {
  GetDailyOrdersSummaryUseCase,
  GetPaymentMethodSummaryUseCase,
  GetTodayOrdersUseCase,
  GetTodayExpensesUseCase,
  GetTopCustomersUseCase,
  GetDailyPaymentReceivedUseCase,
} from '../use-cases/SummaryUseCases';
import { SummaryController } from '@/presentation/controllers/SummaryController';
import prisma from '@/lib/prisma';

export class SummaryServiceContainer {
  private static summaryRepository: PrismaSummaryRepository;
  private static getDailyOrdersSummaryUseCase: GetDailyOrdersSummaryUseCase;
  private static getPaymentMethodSummaryUseCase: GetPaymentMethodSummaryUseCase;
  private static getTodayOrdersUseCase: GetTodayOrdersUseCase;
  private static getTodayExpensesUseCase: GetTodayExpensesUseCase;
  private static getTopCustomersUseCase: GetTopCustomersUseCase;
  private static getDailyPaymentReceivedUseCase: GetDailyPaymentReceivedUseCase;
  private static summaryController: SummaryController;

  static getSummaryRepository(): PrismaSummaryRepository {
    if (!this.summaryRepository) {
      this.summaryRepository = new PrismaSummaryRepository(prisma);
    }
    return this.summaryRepository;
  }

  static getGetDailyOrdersSummaryUseCase(): GetDailyOrdersSummaryUseCase {
    if (!this.getDailyOrdersSummaryUseCase) {
      const repository = this.getSummaryRepository();
      this.getDailyOrdersSummaryUseCase = new GetDailyOrdersSummaryUseCase(
        repository
      );
    }
    return this.getDailyOrdersSummaryUseCase;
  }

  static getGetPaymentMethodSummaryUseCase(): GetPaymentMethodSummaryUseCase {
    if (!this.getPaymentMethodSummaryUseCase) {
      const repository = this.getSummaryRepository();
      this.getPaymentMethodSummaryUseCase = new GetPaymentMethodSummaryUseCase(
        repository
      );
    }
    return this.getPaymentMethodSummaryUseCase;
  }

  static getGetTodayOrdersUseCase(): GetTodayOrdersUseCase {
    if (!this.getTodayOrdersUseCase) {
      const repository = this.getSummaryRepository();
      this.getTodayOrdersUseCase = new GetTodayOrdersUseCase(repository);
    }
    return this.getTodayOrdersUseCase;
  }

  static getGetTodayExpensesUseCase(): GetTodayExpensesUseCase {
    if (!this.getTodayExpensesUseCase) {
      const repository = this.getSummaryRepository();
      this.getTodayExpensesUseCase = new GetTodayExpensesUseCase(repository);
    }
    return this.getTodayExpensesUseCase;
  }

  static getGetTopCustomersUseCase(): GetTopCustomersUseCase {
    if (!this.getTopCustomersUseCase) {
      const repository = this.getSummaryRepository();
      this.getTopCustomersUseCase = new GetTopCustomersUseCase(repository);
    }
    return this.getTopCustomersUseCase;
  }

  static getGetDailyPaymentReceivedUseCase(): GetDailyPaymentReceivedUseCase {
    if (!this.getDailyPaymentReceivedUseCase) {
      const repository = this.getSummaryRepository();
      this.getDailyPaymentReceivedUseCase = new GetDailyPaymentReceivedUseCase(
        repository
      );
    }
    return this.getDailyPaymentReceivedUseCase;
  }

  static getSummaryController(): SummaryController {
    if (!this.summaryController) {
      this.summaryController = SummaryController.getInstance();
    }
    return this.summaryController;
  }
}
