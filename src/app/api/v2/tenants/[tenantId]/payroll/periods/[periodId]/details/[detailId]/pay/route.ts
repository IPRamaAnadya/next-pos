import { NextRequest } from 'next/server';
import { PayrollController } from '@/presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string; detailId: string }> }
) {
  const { tenantId, periodId, detailId } = await params;
  return await payrollController.markPayrollDetailAsPaid(tenantId, periodId, detailId);
}