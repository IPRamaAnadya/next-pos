/**
 * Prisma Report Repository Implementation
 * Maps between domain entities and Prisma schema
 */

import { Report, ReportType, ReportStatus } from '../../domain/entities/Report';
import { ReportRepository, PaginatedReports, ReportQueryOptions } from '../../domain/repositories/ReportRepository';
import prisma from '@/lib/prisma';

export class PrismaReportRepository implements ReportRepository {
  private static instance: PrismaReportRepository;

  private constructor() {}

  public static getInstance(): PrismaReportRepository {
    if (!PrismaReportRepository.instance) {
      PrismaReportRepository.instance = new PrismaReportRepository();
    }
    return PrismaReportRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'start_date': 'startDate',
    'end_date': 'endDate',
    'tenant_id': 'tenantId',
    'pdf_url': 'pdfUrl',
    's3_key': 's3Key',
  };

  private validSortFields = new Set([
    'id',
    'tenantId',
    'type',
    'status',
    'startDate',
    'endDate',
    'createdAt',
    'updatedAt',
  ]);

  private mapSortField(apiFieldName: string): string {
    // Check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }

    // Map from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }

    // Default fallback
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<Report | null> {
    try {
      const report = await prisma.report.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      return report ? this.mapToEntity(report) : null;
    } catch (error) {
      console.error('Error finding report by id:', error);
      throw new Error(`Failed to find report: ${error}`);
    }
  }

  async findAll(tenantId: string, options: ReportQueryOptions): Promise<PaginatedReports> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { tenantId };

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate) {
        where.startDate = { gte: filters.startDate };
      }

      if (filters?.endDate) {
        where.endDate = { lte: filters.endDate };
      }

      const mappedSortField = this.mapSortField(sortBy);

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [mappedSortField]: sortDir },
        }),
        prisma.report.count({ where }),
      ]);

      return {
        data: reports.map((report: any) => this.mapToEntity(report)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error finding all reports:', error);
      throw new Error(`Failed to fetch reports: ${error}`);
    }
  }

  async findByPeriod(
    tenantId: string,
    type: ReportType,
    startDate: Date,
    endDate: Date
  ): Promise<Report | null> {
    try {
      const report = await prisma.report.findFirst({
        where: {
          tenantId,
          type,
          startDate,
          endDate,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return report ? this.mapToEntity(report) : null;
    } catch (error) {
      console.error('Error finding report by period:', error);
      throw new Error(`Failed to find report by period: ${error}`);
    }
  }

  async create(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    const report = await prisma.report.create({
      data: {
        tenantId: (data as any).tenantId,
        type: (data as any).type,
        startDate: (data as any).startDate,
        endDate: (data as any).endDate,
        status: (data as any).status,
        pdfUrl: (data as any).pdfUrl,
        s3Key: (data as any).s3Key,
        data: (data as any).data || {},
        error: (data as any).error,
      },
    });

    return this.mapToEntity(report);
  }

  async update(id: string, tenantId: string, updates: Partial<Report>): Promise<Report> {
    const updateData: any = {};

    if ((updates as any).status !== undefined) updateData.status = (updates as any).status;
    if ((updates as any).pdfUrl !== undefined) updateData.pdfUrl = (updates as any).pdfUrl;
    if ((updates as any).s3Key !== undefined) updateData.s3Key = (updates as any).s3Key;
    if ((updates as any).data !== undefined) updateData.data = (updates as any).data;
    if ((updates as any).error !== undefined) updateData.error = (updates as any).error;

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(report);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.report.delete({
      where: { id },
    });
  }

  private mapToEntity(data: any): Report {
    return new Report({
      id: data.id,
      tenantId: data.tenantId,
      type: data.type as ReportType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status as ReportStatus,
      pdfUrl: data.pdfUrl,
      s3Key: data.s3Key,
      data: data.data || {},
      error: data.error,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
