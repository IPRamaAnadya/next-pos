import { NextRequest } from 'next/server';
import { attendanceService } from '@/v3/modules/attendance/attendance.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const body = await request.json();
    const { staffId, date, checkInTime, shiftId, isWeekend } = body;

    if (!staffId) return apiResponse.validationError([{ field: 'staffId', message: 'staffId is required' }]);
    if (!checkInTime) return apiResponse.validationError([{ field: 'checkInTime', message: 'checkInTime is required' }]);

    const data = await attendanceService.checkIn(payload.tenantId, {
      staffId,
      date,
      checkInTime,
      shiftId,
      isWeekend,
    });
    return apiResponse.success({ data, message: 'Checked in successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
