import { NextRequest } from 'next/server';
import { attendanceService } from '@/v3/modules/attendance/attendance.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ attendanceId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { attendanceId } = await params;
    const data = await attendanceService.getAttendance(attendanceId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can manually update attendance');

    const { attendanceId } = await params;
    const body = await request.json();
    const { checkInTime, checkOutTime, shiftId, isWeekend, totalHours } = body;

    const data = await attendanceService.updateAttendance(attendanceId, payload.tenantId, {
      checkInTime,
      checkOutTime,
      shiftId,
      isWeekend,
      totalHours: totalHours !== undefined ? Number(totalHours) : undefined,
    });
    return apiResponse.success({ data, message: 'Attendance updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete attendance records');

    const { attendanceId } = await params;
    await attendanceService.deleteAttendance(attendanceId, payload.tenantId);
    return apiResponse.success({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
