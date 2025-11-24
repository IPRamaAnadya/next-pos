import { NextRequest } from 'next/server';
import { StaffShiftController } from '@/presentation/controllers/StaffShiftController';

// Use singleton to prevent memory leaks
const getStaffShiftController = () => StaffShiftController.getInstance();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; staffShiftId: string }> }
) {
  const { tenantId, staffShiftId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.checkInStaff(req, tenantId, staffShiftId);
}