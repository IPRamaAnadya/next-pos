import { NextRequest } from 'next/server';
import { PayrollController } from '@/presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  return await payrollController.getPayrollSettings(tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  return await payrollController.createPayrollSetting(req, tenantId);
}