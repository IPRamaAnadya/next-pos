import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProfitAndLossReportData } from './profit-loss-service';

export async function GET(req: NextRequest, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period') || undefined;
  const data = await getProfitAndLossReportData(tenantId,req, periodParam);
  return NextResponse.json({ meta: { status: 200, message: '' }, data });
}
