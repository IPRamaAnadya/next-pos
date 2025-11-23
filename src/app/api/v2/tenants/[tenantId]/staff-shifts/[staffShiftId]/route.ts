import { NextRequest } from 'next/server';
import { StaffShiftController } from '../../../../../../../presentation/controllers/StaffShiftController';

// Use singleton to prevent memory leaks
const getStaffShiftController = () => StaffShiftController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; staffShiftId: string }> }
) {
  const { tenantId, staffShiftId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.getStaffShiftById(req, tenantId, staffShiftId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; staffShiftId: string }> }
) {
  const { tenantId, staffShiftId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.updateStaffShift(req, tenantId, staffShiftId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; staffShiftId: string }> }
) {
  const { tenantId, staffShiftId } = await params;
  const staffShiftController = getStaffShiftController();
  return await staffShiftController.deleteStaffShift(req, tenantId, staffShiftId);
}