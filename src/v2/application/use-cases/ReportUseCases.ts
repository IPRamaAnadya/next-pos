/**
 * Report Use Cases
 * Application layer business logic for report operations
 */

import { Report, ReportType, ReportStatus } from '../../domain/entities/Report';
import { ReportRepository } from '../../domain/repositories/ReportRepository';
import { ReportDomainService } from '../../domain/services/ReportDomainService';
import { ReportQueryOptions } from './interfaces/ReportQueryOptions';

export interface GenerateReportParams {
  tenantId: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
}

export class ReportUseCases {
  private static instance: ReportUseCases;

  private constructor(private reportRepository: ReportRepository) {}

  public static getInstance(reportRepository: ReportRepository): ReportUseCases {
    if (!ReportUseCases.instance) {
      ReportUseCases.instance = new ReportUseCases(reportRepository);
    }
    return ReportUseCases.instance;
  }

  /**
   * Get all reports with pagination and filters
   */
  async getReports(tenantId: string, options: ReportQueryOptions) {
    return await this.reportRepository.findAll(tenantId, options);
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string, tenantId: string): Promise<Report> {
    const report = await this.reportRepository.findById(id, tenantId);

    if (!report) {
      throw new Error(`Report not found: ${id}`);
    }

    return report;
  }

  /**
   * Generate or retrieve cached report
   * If report exists for the period, return it. Otherwise, create a new one.
   */
  async generateReport(params: GenerateReportParams): Promise<Report> {
    // Validate report period (only previous months allowed)
    ReportDomainService.validateReportPeriod(params.startDate, params.endDate);

    // Check if report already exists for this period
    const existingReport = await this.reportRepository.findByPeriod(
      params.tenantId,
      params.type,
      params.startDate,
      params.endDate
    );

    if (existingReport && existingReport.isGenerated()) {
      // Check if report needs regeneration (older than 7 days)
      if (!ReportDomainService.needsRegeneration(existingReport)) {
        return existingReport;
      }
    }

    // Create new report record with PENDING status
    const report = await this.reportRepository.create({
      tenantId: params.tenantId,
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
      status: ReportStatus.PENDING,
      pdfUrl: null,
      s3Key: null,
      data: {},
      error: null,
    } as any);

    return report;
  }

  /**
   * Update report after PDF generation
   */
  async updateReportWithPdf(
    id: string,
    tenantId: string,
    pdfUrl: string,
    s3Key: string,
    data: any
  ): Promise<Report> {
    const report = await this.getReportById(id, tenantId);

    return await this.reportRepository.update(id, tenantId, {
      status: ReportStatus.GENERATED,
      pdfUrl,
      s3Key,
      data,
      updatedAt: new Date(),
    } as any);
  }

  /**
   * Mark report as failed
   */
  async markReportAsFailed(id: string, tenantId: string, error: string): Promise<Report> {
    return await this.reportRepository.update(id, tenantId, {
      status: ReportStatus.FAILED,
      error,
      updatedAt: new Date(),
    } as any);
  }

  /**
   * Delete report
   */
  async deleteReport(id: string, tenantId: string): Promise<void> {
    await this.getReportById(id, tenantId); // Ensure exists
    await this.reportRepository.delete(id, tenantId);
  }

  /**
   * Get available report periods
   * Returns list of months from first order to last month (excluding current month)
   */
  async getAvailablePeriods(tenantId: string): Promise<string[]> {
    // This will be implemented to return available periods
    // For now, return empty array as placeholder
    return [];
  }
}
