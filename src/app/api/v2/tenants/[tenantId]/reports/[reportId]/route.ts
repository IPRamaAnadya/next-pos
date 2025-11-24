/**
 * API Routes: /api/v2/tenants/[tenantId]/reports/[reportId]
 * GET - Get report by ID
 * DELETE - Delete report
 */

import { NextRequest } from 'next/server';
import { ReportController } from '@/presentation/controllers/ReportController';

// Use singleton to prevent memory leaks
const getReportController = () => ReportController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; reportId: string }> }
) {
  const { tenantId, reportId } = await params;
  const reportController = getReportController();
  return await reportController.getReportById(req, tenantId, reportId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; reportId: string }> }
) {
  const { tenantId, reportId } = await params;
  const reportController = getReportController();
  return await reportController.deleteReport(req, tenantId, reportId);
}
