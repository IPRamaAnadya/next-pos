/**
 * Report Query Options Interface
 */

import { ReportType } from '../../domain/entities/Report';

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
