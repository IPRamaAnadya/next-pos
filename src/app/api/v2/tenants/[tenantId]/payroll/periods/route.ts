import { NextRequest } from 'next/server';
import { PayrollController } from '../../../../../../../presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const url = new URL(req.url);
  const includeFinalized = url.searchParams.get('include_finalized') !== 'false';
  
  return await payrollController.getPayrollPeriods(tenantId, includeFinalized);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  return await payrollController.createPayrollPeriod(req, tenantId);
}