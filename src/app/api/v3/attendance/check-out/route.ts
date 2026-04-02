import { NextRequest } from 'next/server';
import { attendanceService } from '@/v3/modules/attendance/attendance.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const body = await request.json();
    const { attendanceId, checkOutTime } = body;

    if (!attendanceId) {
      return apiResponse.validationError([{ field: 'attendanceId', message: 'attendanceId is required' }]);
    }
    if (!checkOutTime) {
      return apiResponse.validationError([{ field: 'checkOutTime', message: 'checkOutTime is required' }]);
    }

    const data = await attendanceService.checkOut(payload.tenantId, { attendanceId, checkOutTime });
    return apiResponse.success({ data, message: 'Checked out successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
