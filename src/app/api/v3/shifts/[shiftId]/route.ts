import { NextRequest } from 'next/server';
import { shiftService } from '@/v3/modules/shift/shift.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ shiftId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { shiftId } = await params;
    const data = await shiftService.getShift(shiftId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can update shifts');

    const { shiftId } = await params;
    const body = await request.json();
    const {
      name, startTime, endTime, isActive, calculateBeforeStartTime, hasBreakTime,
      breakDuration, minWorkingHours, maxWorkingHours, overtimeMultiplier,
      lateThreshold, earlyCheckInAllowed, color, description,
    } = body;

    const data = await shiftService.updateShift(shiftId, payload.tenantId, {
      name, startTime, endTime, isActive, calculateBeforeStartTime, hasBreakTime,
      breakDuration, minWorkingHours, maxWorkingHours, overtimeMultiplier,
      lateThreshold, earlyCheckInAllowed, color, description,
    });
    return apiResponse.success({ data, message: 'Shift updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete shifts');

    const { shiftId } = await params;
    await shiftService.deleteShift(shiftId, payload.tenantId);
    return apiResponse.success({ message: 'Shift deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
