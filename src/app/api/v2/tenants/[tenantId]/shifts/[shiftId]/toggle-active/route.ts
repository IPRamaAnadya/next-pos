import { NextRequest } from 'next/server';
import { ShiftController } from '../../../../../../../../presentation/controllers/ShiftController';

// Use singleton to prevent memory leaks
const getShiftController = () => ShiftController.getInstance();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; shiftId: string }> }
) {
  const { tenantId, shiftId } = await params;
  const shiftController = getShiftController();
  return await shiftController.toggleShiftActive(req, tenantId, shiftId);
}