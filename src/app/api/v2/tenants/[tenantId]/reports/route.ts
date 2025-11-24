/**
 * API Routes: /api/v2/tenants/[tenantId]/reports
 * GET - Get all reports
 * POST - Generate a new report
 */

import { NextRequest } from 'next/server';
import { ReportController } from '../../../../../../presentation/controllers/ReportController';

// Use singleton to prevent memory leaks
const getReportController = () => ReportController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const reportController = getReportController();
  return await reportController.getReports(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const reportController = getReportController();
  return await reportController.generateReport(req, tenantId);
}
