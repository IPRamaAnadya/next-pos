/**
 * PDF Generation Service for Reports
 * Handles generating PDF reports and uploading to S3
 */

import s3 from '@/lib/s3';
import { ReportType } from '@/domain/entities/Report';

export interface SalesReportData {
  reportTitle: string;
  period: string;
  tenantName: string;
  summary: {
    totalSalesBruto: number;
    totalOrders: number;
    totalItems: number;
    totalDiscounts: number;
    totalSales: number;
  };
  details: Array<{
    title: string;
    category: string;
    saleAmount: number;
    orderAmount: number;
    itemCount: number;
  }>;
}

export interface ProfitLossReportData {
  reportTitle: string;
  period: string;
  data: Array<{
    category: string;
    items: Array<{
      classification: string;
      value: number | null;
      percentage: number | null;
      total: number | null;
    }>;
  }>;
  summary: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

export class ReportPdfService {
  private static instance: ReportPdfService;

  private constructor() {}

  public static getInstance(): ReportPdfService {
    if (!ReportPdfService.instance) {
      ReportPdfService.instance = new ReportPdfService();
    }
    return ReportPdfService.instance;
  }

  /**
   * Generate PDF from report data and upload to S3
   */
  async generateAndUploadPdf(
    reportType: ReportType,
    data: SalesReportData | ProfitLossReportData,
    tenantId: string
  ): Promise<{ pdfUrl: string; s3Key: string }> {
    try {
      // Generate PDF buffer based on report type
      const pdfBuffer = await this.generatePdfBuffer(reportType, data);

      // Upload to S3
      const s3Key = this.generateS3Key(tenantId, reportType, data.period);
      const pdfUrl = await this.uploadToS3(pdfBuffer, s3Key);

      return { pdfUrl, s3Key };
    } catch (error) {
      console.error('Error generating and uploading PDF:', error);
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }

  /**
   * Generate PDF buffer from data
   * This is a placeholder - you should implement actual PDF generation
   * using a library like pdfmake or puppeteer
   */
  private async generatePdfBuffer(
    reportType: ReportType,
    data: SalesReportData | ProfitLossReportData
  ): Promise<Buffer> {
    // TODO: Implement actual PDF generation using pdfmake or similar
    // For now, return a placeholder
    
    let htmlContent = '';
    
    if (reportType === ReportType.SALES) {
      htmlContent = this.generateSalesHtml(data as SalesReportData);
    } else if (reportType === ReportType.PROFIT_LOSS) {
      htmlContent = this.generateProfitLossHtml(data as ProfitLossReportData);
    }

    // Convert HTML to PDF (placeholder - use puppeteer or pdfmake in production)
    return Buffer.from(htmlContent, 'utf-8');
  }

  /**
   * Generate HTML for Sales Report (similar to existing format)
   */
  private generateSalesHtml(data: SalesReportData): string {
    const detailsRows = data.details
      .map(
        (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.title}</td>
          <td>${item.category}</td>
          <td style="text-align: right;">Rp ${item.saleAmount.toLocaleString('id-ID')}</td>
          <td style="text-align: right;">${item.orderAmount}</td>
          <td style="text-align: right;">${item.itemCount}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          .period { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #4CAF50; color: white; }
          .summary { margin-top: 30px; }
          .summary-item { display: flex; justify-content: space-between; padding: 5px 0; }
        </style>
      </head>
      <body>
        <h1>${data.reportTitle}</h1>
        <div class="period">${data.period}</div>
        
        <div class="summary">
          <h2>Ringkasan</h2>
          <div class="summary-item"><span>Total Penjualan Bruto:</span><span>Rp ${data.summary.totalSalesBruto.toLocaleString('id-ID')}</span></div>
          <div class="summary-item"><span>Total Diskon:</span><span>Rp ${data.summary.totalDiscounts.toLocaleString('id-ID')}</span></div>
          <div class="summary-item"><span>Total Penjualan Netto:</span><span>Rp ${data.summary.totalSales.toLocaleString('id-ID')}</span></div>
          <div class="summary-item"><span>Total Pesanan:</span><span>${data.summary.totalOrders}</span></div>
          <div class="summary-item"><span>Total Item Terjual:</span><span>${data.summary.totalItems}</span></div>
        </div>

        <h2>Detail Penjualan per Produk</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Total Penjualan</th>
              <th>Jumlah Order</th>
              <th>Jumlah Item</th>
            </tr>
          </thead>
          <tbody>
            ${detailsRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for Profit Loss Report (similar to existing format)
   */
  private generateProfitLossHtml(data: ProfitLossReportData): string {
    const categoriesHtml = data.data
      .map(
        (category) => `
        <h3>${category.category}</h3>
        <table>
          <thead>
            <tr>
              <th>Klasifikasi</th>
              <th>Nilai</th>
              <th>Persentase</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${category.items
              .map(
                (item) => `
              <tr>
                <td>${item.classification}</td>
                <td>${item.value !== null ? 'Rp ' + item.value.toLocaleString('id-ID') : '-'}</td>
                <td>${item.percentage !== null ? (item.percentage * 100).toFixed(2) + '%' : '-'}</td>
                <td>${item.total !== null ? 'Rp ' + item.total.toLocaleString('id-ID') : '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
      )
      .join('');

    const summaryHtml = data.summary
      .map(
        (item) => `
      <div class="summary-item">
        <span><strong>${item.label}:</strong></span>
        <span>Rp ${item.value.toLocaleString('id-ID')} (${(item.percentage * 100).toFixed(2)}%)</span>
      </div>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          .period { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #2196F3; color: white; }
          .summary { margin-top: 30px; background: #f0f0f0; padding: 15px; border-radius: 5px; }
          .summary-item { display: flex; justify-content: space-between; padding: 5px 0; }
        </style>
      </head>
      <body>
        <h1>${data.reportTitle}</h1>
        <div class="period">${data.period}</div>
        
        ${categoriesHtml}

        <div class="summary">
          <h2>Ringkasan</h2>
          ${summaryHtml}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate S3 key for the report
   */
  private generateS3Key(tenantId: string, reportType: ReportType, period: string): string {
    const timestamp = Date.now();
    const sanitizedPeriod = period.replace(/\s+/g, '_');
    return `reports/${tenantId}/${reportType.toLowerCase()}/${sanitizedPeriod}_${timestamp}.pdf`;
  }

  /**
   * Upload PDF buffer to S3
   */
  private async uploadToS3(pdfBuffer: Buffer, s3Key: string): Promise<string> {
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'public-read',
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    return uploadResult.Location;
  }
}
