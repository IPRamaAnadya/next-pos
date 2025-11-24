import { NextRequest } from 'next/server';
import { PayrollController } from '@/presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employee_id');
  
  return await payrollController.getPayrollDetails(tenantId, periodId, employeeId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; periodId: string }> }
) {
  const { tenantId, periodId } = await params;
  return await payrollController.createPayrollDetail(req, tenantId, periodId);
}