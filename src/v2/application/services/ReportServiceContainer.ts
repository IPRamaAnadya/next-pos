/**
 * Report Service Container
 * Dependency injection container for report feature
 */

import { ReportUseCases } from '../use-cases/ReportUseCases';
import { PrismaReportRepository } from '../../infrastructure/repositories/PrismaReportRepository';

export class ReportServiceContainer {
  private static reportUseCases: ReportUseCases;

  static getReportUseCases(): ReportUseCases {
    if (!this.reportUseCases) {
      const reportRepository = PrismaReportRepository.getInstance();
      this.reportUseCases = ReportUseCases.getInstance(reportRepository);
    }
    return this.reportUseCases;
  }
}
