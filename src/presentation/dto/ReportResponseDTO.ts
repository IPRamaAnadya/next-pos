/**
 * Report Response DTOs
 * Map domain entities to API responses
 */

import { Report } from '../../domain/entities/Report';
import { PaginatedReports } from '../../domain/repositories/ReportRepository';
import { apiResponse } from '@/app/api/utils/response';

export class ReportResponseDTO {
  static mapToResponse(report: Report) {
    return {
      id: report.id,
      tenant_id: report.tenantId,
      type: report.type,
      start_date: report.startDate.toISOString(),
      end_date: report.endDate.toISOString(),
      status: report.status,
      pdf_url: report.pdfUrl,
      s3_key: report.s3Key,
      data: report.data,
      error: report.error,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };
  }

  static mapPaginatedResponse(paginatedReports: PaginatedReports) {
    return apiResponse.success({
      data: paginatedReports.data.map((report) => this.mapToResponse(report)),
      pagination: {
        ...paginatedReports.pagination,
        pageSize: paginatedReports.pagination.limit,
      },
      message: 'Reports retrieved successfully',
    });
  }

  static mapSingleResponse(report: Report) {
    return apiResponse.success({
      data: this.mapToResponse(report),
      message: 'Report retrieved successfully',
    });
  }

  static mapGeneratedResponse(report: Report) {
    return apiResponse.success({
      data: this.mapToResponse(report),
      message: 'Report generated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: null,
      message: 'Report deleted successfully',
    });
  }
}
