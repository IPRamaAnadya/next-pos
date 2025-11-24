import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSalesReportData } from './sales-report-service';

export async function GET(req: NextRequest, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period') || undefined;
  const data = await getSalesReportData(tenantId,req,  periodParam);
  return NextResponse.json({ meta: { status: 200, message: '' }, data });
}
