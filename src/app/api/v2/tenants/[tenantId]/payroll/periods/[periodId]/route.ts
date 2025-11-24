import { NextRequest } from 'next/server';
import { PayrollController } from '@/presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  return await payrollController.getPayrollPeriod(tenantId, periodId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  return await payrollController.updatePayrollPeriod(req, tenantId, periodId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  return await payrollController.deletePayrollPeriod(tenantId, periodId);
}