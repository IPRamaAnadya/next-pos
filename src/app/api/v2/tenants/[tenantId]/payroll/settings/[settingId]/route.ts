import { NextRequest } from 'next/server';
import { PayrollController } from '../../../../../../../../presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; settingId: string }> }
) {
  const { tenantId, settingId } = await params;
  return await payrollController.getPayrollSetting(tenantId, settingId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; settingId: string }> }
) {
  const { tenantId, settingId } = await params;
  return await payrollController.updatePayrollSetting(req, tenantId, settingId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; settingId: string }> }
) {
  const { tenantId, settingId } = await params;
  return await payrollController.deletePayrollSetting(tenantId, settingId);
}