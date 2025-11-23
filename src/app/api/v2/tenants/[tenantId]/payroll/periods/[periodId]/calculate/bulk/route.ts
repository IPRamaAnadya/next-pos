import { NextRequest } from 'next/server';
import { PayrollController } from '../../../../../../../../../../presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  return await payrollController.bulkCalculatePayroll(req, tenantId, periodId);
}