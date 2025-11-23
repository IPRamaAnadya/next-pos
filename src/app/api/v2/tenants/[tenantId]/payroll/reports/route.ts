import { NextRequest } from 'next/server';
import { PayrollController } from '../../../../../../../presentation/controllers/PayrollController';

const payrollController = new PayrollController();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const url = new URL(req.url);
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const employeeId = url.searchParams.get('employee_id');
  
  return await payrollController.getPayrollReports(tenantId, startDate, endDate, employeeId);
}