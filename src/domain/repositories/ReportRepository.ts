/**
 * Report Repository Interface
 * Defines data access methods for reports
 */

import { Report, ReportType } from '../entities/Report';

export interface ReportQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    type?: ReportType;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  };
}

export interface PaginatedReports {
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReportRepository {
  findById(id: string, tenantId: string): Promise<Report | null>;
  findAll(tenantId: string, options: ReportQueryOptions): Promise<PaginatedReports>;
  findByPeriod(
    tenantId: string,
    type: ReportType,
    startDate: Date,
    endDate: Date
  ): Promise<Report | null>;
  create(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
  update(id: string, tenantId: string, updates: Partial<Report>): Promise<Report>;
  delete(id: string, tenantId: string): Promise<void>;
}
