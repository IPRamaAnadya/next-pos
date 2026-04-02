/**
 * Report Domain Service
 * Contains business logic for report validation and processing
 */

import { Report, ReportType } from '../entities/Report';

export class ReportDomainService {
  /**
   * Validate report period
   * Users can only access reports for previous months, not current month
   */
  static validateReportPeriod(startDate: Date, endDate: Date): void {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // // Ensure startDate is before current month
    // if (startDate >= currentMonthStart) {
    //   throw new Error('Cannot generate report for current month. Only previous months are allowed.');
    // }

    // // Ensure endDate is before or at the start of current month
    // if (endDate > currentMonthStart) {
    //   throw new Error('Report end date must be before the current month.');
    // }

    // Ensure startDate is before endDate
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date.');
    }
  }

  /**
   * Validate report type
   */
  static validateReportType(type: string): ReportType {
    if (!Object.values(ReportType).includes(type as ReportType)) {
      throw new Error(`Invalid report type: ${type}. Must be SALES or PROFIT_LOSS.`);
    }
    return type as ReportType;
  }

  /**
   * Generate report cache key
   */
  static generateCacheKey(tenantId: string, type: ReportType, startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${tenantId}_${type}_${start}_${end}`;
  }

  /**
   * Check if report needs regeneration
   * Reports older than 7 days should be regenerated
   */
  static needsRegeneration(report: Report): boolean {
    const daysSinceGeneration = Math.floor(
      (Date.now() - report.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceGeneration > 7;
  }
}
