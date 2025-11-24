import { NextRequest } from 'next/server';
import { StaffShiftController } from '@/presentation/controllers/StaffShiftController';

// Use singleton to prevent memory leaks
const getStaffShiftController = () => StaffShiftController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; staffId: string }> }
) {
  const { tenantId, staffId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.getStaffWorkSummary(req, tenantId, staffId);
}