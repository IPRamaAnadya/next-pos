import { NextRequest } from 'next/server';
import { StaffShiftController } from '../../../../../../presentation/controllers/StaffShiftController';

// Use singleton to prevent memory leaks
const getStaffShiftController = () => StaffShiftController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.getStaffShifts(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.assignStaffToShift(req, tenantId);
}