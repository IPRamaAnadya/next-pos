/**
 * Report Controller
 * Handles HTTP requests for report operations
 */

import { NextRequest } from 'next/server';
import { ReportServiceContainer } from '../../application/services/ReportServiceContainer';
import { ReportResponseDTO } from '../dto/ReportResponseDTO';
import {
  generateReportSchema,
  reportQuerySchema,
  GenerateReportRequest,
  ReportQueryRequest,
} from '../dto/ReportRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';
import { ReportType } from '../../domain/entities/Report';
import { ReportPdfService } from '../../infrastructure/services/ReportPdfService';
import prisma from '@/lib/prisma';
import { SalesReportData, ProfitLossReportData } from '../../infrastructure/services/ReportPdfService';

export class ReportController {
  private static instance: ReportController;

  private constructor() {}

  public static getInstance(): ReportController {
    if (!ReportController.instance) {
      ReportController.instance = new ReportController();
    }
    return ReportController.instance;
  }

  /**
   * Get all reports with pagination and filters
   */
  async getReports(req: NextRequest, tenantId: string) {
    try {
      // Verify JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return apiResponse.unauthorized('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || !decoded.tenantId) {
        return apiResponse.unauthorized('Invalid token');
      }

      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Access denied to this tenant');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams: any = {
        p_limit: searchParams.get('p_limit') ? Number(searchParams.get('p_limit')) : undefined,
        p_page: searchParams.get('p_page') ? Number(searchParams.get('p_page')) : undefined,
        p_sort_by: searchParams.get('p_sort_by') || undefined,
        p_sort_dir: searchParams.get('p_sort_dir') || undefined,
        p_type: searchParams.get('p_type') || undefined,
        p_status: searchParams.get('p_status') || undefined,
        p_start_date: searchParams.get('p_start_date') ? new Date(searchParams.get('p_start_date')!) : undefined,
        p_end_date: searchParams.get('p_end_date') ? new Date(searchParams.get('p_end_date')!) : undefined,
      };

      const validatedQuery = await reportQuerySchema.validate(queryParams, {
        abortEarly: false,
        stripUnknown: true,
      });

      const reportUseCases = ReportServiceContainer.getReportUseCases();
      const reports = await reportUseCases.getReports(tenantId, {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir,
        filters: {
          type: validatedQuery.p_type as ReportType,
          status: validatedQuery.p_status,
          startDate: validatedQuery.p_start_date,
          endDate: validatedQuery.p_end_date,
        },
      });

      return ReportResponseDTO.mapPaginatedResponse(reports);
    } catch (error: any) {
      console.error('Get reports error:', error);
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors?.map((err: string) => ({ field: 'general', message: err })) || []
        );
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(req: NextRequest, tenantId: string, reportId: string) {
    try {
      // Verify JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return apiResponse.unauthorized('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || !decoded.tenantId) {
        return apiResponse.unauthorized('Invalid token');
      }

      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Access denied to this tenant');
      }

      const reportUseCases = ReportServiceContainer.getReportUseCases();
      const report = await reportUseCases.getReportById(reportId, tenantId);

      return ReportResponseDTO.mapSingleResponse(report);
    } catch (error: any) {
      console.error('Get report by ID error:', error);
      if (error.message?.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Generate report (or retrieve cached)
   */
  async generateReport(req: NextRequest, tenantId: string) {
    try {
      // Verify JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return apiResponse.unauthorized('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || !decoded.tenantId) {
        return apiResponse.unauthorized('Invalid token');
      }

      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Access denied to this tenant');
      }

      // Parse and validate body
      const body = await req.json();
      const validatedData = await generateReportSchema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const reportUseCases = ReportServiceContainer.getReportUseCases();
      
      // Generate or retrieve report
      const report = await reportUseCases.generateReport({
        tenantId,
        type: validatedData.type as ReportType,
        startDate: new Date(validatedData.start_date),
        endDate: new Date(validatedData.end_date),
      });

      // If report is already generated and not stale, return it
      if (report.isGenerated()) {
        return ReportResponseDTO.mapGeneratedResponse(report);
      }

      // Generate PDF in background
      // Fetch report data based on type
      let reportData: SalesReportData | ProfitLossReportData;
      
      if (validatedData.type === 'SALES') {
        reportData = await this.fetchSalesReportData(tenantId, validatedData.start_date, validatedData.end_date);
      } else {
        reportData = await this.fetchProfitLossReportData(tenantId, validatedData.start_date, validatedData.end_date);
      }

      // Generate and upload PDF
      try {
        const pdfService = ReportPdfService.getInstance();
        const { pdfUrl, s3Key } = await pdfService.generateAndUploadPdf(
          validatedData.type as ReportType,
          reportData,
          tenantId
        );

        // Update report with PDF URL
        const updatedReport = await reportUseCases.updateReportWithPdf(
          report.id,
          tenantId,
          pdfUrl,
          s3Key,
          reportData
        );

        return ReportResponseDTO.mapGeneratedResponse(updatedReport);
      } catch (pdfError: any) {
        // Mark report as failed
        await reportUseCases.markReportAsFailed(report.id, tenantId, pdfError.message);
        throw pdfError;
      }
    } catch (error: any) {
      console.error('Generate report error:', error);
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors?.map((err: string) => ({ field: 'general', message: err })) || []
        );
      }
      if (error.message?.includes('current month')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Delete report
   */
  async deleteReport(req: NextRequest, tenantId: string, reportId: string) {
    try {
      // Verify JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return apiResponse.unauthorized('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || !decoded.tenantId) {
        return apiResponse.unauthorized('Invalid token');
      }

      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Access denied to this tenant');
      }

      const reportUseCases = ReportServiceContainer.getReportUseCases();
      await reportUseCases.deleteReport(reportId, tenantId);

      return ReportResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete report error:', error);
      if (error.message?.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Fetch sales report data from database
   */
  private async fetchSalesReportData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesReportData> {
    // Get sales orders for the period
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
        paymentStatus: 'paid',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                productCategory: true,
              },
            },
          },
        },
      },
    });

    // Aggregate sales data
    let totalSalesBruto = 0;
    let totalDiscounts = 0;
    let totalSales = 0;
    let totalOrders = orders.length;
    let totalItems = 0;
    const productMap = new Map();

    for (const order of orders) {
      let orderBruto = 0;
      for (const item of order.items) {
        const key = item.productId;
        const productName = item.productName;
        const categoryName = item.product?.productCategory?.name || '-';
        const saleAmount = Number(item.productPrice) * Number(item.qty);
        orderBruto += saleAmount;
        totalItems += Number(item.qty);
        
        if (!productMap.has(key)) {
          productMap.set(key, {
            title: productName,
            category: categoryName,
            saleAmount: 0,
            orderAmount: 0,
            itemCount: 0,
          });
        }
        
        const prod = productMap.get(key);
        prod.saleAmount += saleAmount;
        prod.orderAmount += 1;
        prod.itemCount += Number(item.qty);
      }
      
      totalSalesBruto += orderBruto;
      totalDiscounts += Number(order.discountAmount || 0);
      totalSales += orderBruto - Number(order.discountAmount || 0);
    }

    const details = Array.from(productMap.values());

    // Get tenant name
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || '-';

    // Format period
    const period = this.formatPeriod(startDate, endDate);

    return {
      reportTitle: 'Laporan Penjualan ' + tenantName,
      period,
      tenantName,
      summary: {
        totalSalesBruto,
        totalOrders,
        totalItems,
        totalDiscounts,
        totalSales,
      },
      details,
    };
  }

  /**
   * Fetch profit and loss report data from database
   */
  private async fetchProfitLossReportData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfitLossReportData> {
    // Fetch tenant name
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const tenantName = tenant?.name || '';

    // Get total sales (Pendapatan)
    const sales = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: {
        tenantId,
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
        paymentStatus: 'paid',
      },
    });
    const totalPendapatan = Number(sales._sum.grandTotal ?? 0);

    // Get expense categories and their totals (Beban)
    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { tenantId },
      include: {
        expenses: {
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
      },
    });

    let bebanItems = [];
    let totalBeban = 0;
    
    for (const cat of expenseCategories) {
      const value = cat.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      totalBeban += value;
      bebanItems.push({
        classification: cat.name,
        value,
        percentage: totalPendapatan ? value / totalPendapatan : 0,
        total: null,
      });
    }

    // Pajak 11%
    const pajak = 0;
    const labaSebelumPajak = totalPendapatan - totalBeban;
    const labaBersih = labaSebelumPajak;

    const period = this.formatPeriod(startDate, endDate);

    return {
      reportTitle: `Laporan Laba Rugi ${tenantName}`,
      period,
      data: [
        {
          category: 'Pendapatan',
          items: [
            {
              classification: 'Penjualan',
              value: totalPendapatan,
              percentage: 1,
              total: null,
            },
            {
              classification: 'Total Pendapatan',
              value: null,
              percentage: null,
              total: totalPendapatan,
            },
          ],
        },
        {
          category: 'Beban',
          items: [
            ...bebanItems,
            {
              classification: 'Total Beban',
              value: null,
              percentage: null,
              total: totalBeban,
            },
          ],
        },
      ],
      summary: [
        {
          label: 'Laba Sebelum Pajak',
          value: labaSebelumPajak,
          percentage: totalPendapatan ? labaSebelumPajak / totalPendapatan : 0,
        },
        {
          label: 'Pajak',
          value: pajak,
          percentage: totalPendapatan ? pajak / totalPendapatan : 0,
        },
        {
          label: 'Laba Bersih',
          value: labaBersih,
          percentage: totalPendapatan ? labaBersih / totalPendapatan : 0,
        },
      ],
    };
  }

  /**
   * Format period string
   */
  private formatPeriod(startDate: Date, endDate: Date): string {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${months[start.getMonth()]} ${start.getFullYear()}`;
    }
    
    return `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`;
  }
}
