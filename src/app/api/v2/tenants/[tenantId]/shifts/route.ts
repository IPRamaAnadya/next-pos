import { NextRequest } from 'next/server';
import { ShiftController } from '../../../../../../presentation/controllers/ShiftController';

// Use singleton to prevent memory leaks
const getShiftController = () => ShiftController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const shiftController = getShiftController();
  return await shiftController.getShifts(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const shiftController = getShiftController();
  return await shiftController.createShift(req, tenantId);
}