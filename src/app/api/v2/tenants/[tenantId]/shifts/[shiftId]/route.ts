import { NextRequest } from 'next/server';
import { ShiftController } from '../../../../../../../presentation/controllers/ShiftController';

// Use singleton to prevent memory leaks
const getShiftController = () => ShiftController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; shiftId: string }> }
) {
  const { tenantId, shiftId } = await params;
  const shiftController = getShiftController();
  return await shiftController.getShiftById(req, tenantId, shiftId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; shiftId: string }> }
) {
  const { tenantId, shiftId } = await params;
  const shiftController = getShiftController();
  return await shiftController.updateShift(req, tenantId, shiftId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; shiftId: string }> }
) {
  const { tenantId, shiftId } = await params;
  const shiftController = getShiftController();
  return await shiftController.deleteShift(req, tenantId, shiftId);
}