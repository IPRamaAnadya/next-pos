
import { uploadService } from "@/lib/uploader";
import { NextRequest, NextResponse } from "next/server";
import { generateSalesReportPdf } from "./pdf-lib-sales-report";
import prisma from "@/lib/prisma";
import { apiResponse } from "@/app/api/utils/response";
import { getSalesReportData } from "../sales-report-service";

export async function GET(req: NextRequest, context: { params: Promise<{ tenantId: string }> }) {
	const { tenantId } = await context.params;
	const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period') || undefined;
  const data = await getSalesReportData(tenantId, req, periodParam);

  // check if data is available in database
  const previousReport = await prisma.tenantReport.findFirst({
    where: {
      tenantId,
      type: 'sales',
      period: data.period || '',
    },
    select: { id: true, tenantId: true, type: true, period: true, title: true, pdfUrl: true, createdAt: true, data: true },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (previousReport && previousReport.pdfUrl) {
    return apiResponse.success({ data: previousReport });
  }

	// Generate PDF
	const pdfBytes = await generateSalesReportPdf(data);
	const buffer = Buffer.from(pdfBytes);

	// Upload ke S3 menggunakan uploadService
	// File API is not available in Node.js, so use a polyfill
	const epoch = Date.now();
	// @ts-ignore
	const file = new File([buffer], `laporan-penjualan-${epoch}.pdf`, { type: "application/pdf" });
	const url = await uploadService.save(file, { tenantId, folder: "reports", userId: "system" });

  // Save report record to database if not exists
  const report = await prisma.tenantReport.create({
      data: {
        tenantId,
        type: 'sales',
        period: data.period || '',
        title: data.reportTitle,
        data: data,
        pdfUrl: url,
      },
      select: { id: true, tenantId: true, type: true, period: true, title: true, pdfUrl: true, createdAt: true }
    });

  return apiResponse.success({ data: report });
}
