import { NextRequest } from 'next/server';
import { PayrollController } from '@/presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string; detailId: string }> }
) {
  const { tenantId, periodId, detailId } = await params;
  return await payrollController.getPayrollDetail(tenantId, periodId, detailId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string; detailId: string }> }
) {
  const { tenantId, periodId, detailId } = await params;
  return await payrollController.updatePayrollDetail(req, tenantId, periodId, detailId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string; detailId: string }> }
) {
  const { tenantId, periodId, detailId } = await params;
  return await payrollController.deletePayrollDetail(tenantId, periodId, detailId);
}