


import { uploadService } from "@/lib/uploader";
import { NextRequest, NextResponse } from "next/server";
import { generateProfitAndLossPdf } from "./pdf-lib-profit-loss";
import { getProfitAndLossReportData } from "../profit-loss-service";
import prisma from "@/lib/prisma";
import { apiResponse } from "@/app/api/utils/response";

export async function GET(req: NextRequest, context: { params: { tenantId: string } }) {
  const { tenantId } = context.params;
  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period') || undefined;
  const data = await getProfitAndLossReportData(tenantId, periodParam);

  // check if data is available in database
  const previousReport = await prisma.tenantReport.findFirst({
    where: {
      tenantId,
      type: 'profit_and_loss',
      period: data.period || '',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (previousReport && previousReport.pdfUrl) {
    return apiResponse.success({ data: previousReport });
  }

  // Generate PDF using dynamic data
  const pdfBytes = await generateProfitAndLossPdf(data);
  const buffer = Buffer.from(pdfBytes);

  // Upload ke S3 menggunakan uploadService
  // File API is not available in Node.js, so use a polyfill
  // @ts-ignore
  const file = new File([buffer], "laporan-laba-rugi.pdf", { type: "application/pdf" });
  const url = await uploadService.save(file, { tenantId, folder: "reports", userId: "system" });

  // Save report record to database
  const reportRecord = await prisma.tenantReport.create({
    data: {
      tenantId,
      type: 'profit_and_loss',
      period: data.period || '',
      title: data.reportTitle,
      data: data,
      pdfUrl: url,
    },
  });
  return apiResponse.success({data: reportRecord});
}