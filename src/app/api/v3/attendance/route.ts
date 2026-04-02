import { NextRequest } from 'next/server';
import { attendanceService } from '@/v3/modules/attendance/attendance.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isWeekendParam = searchParams.get('isWeekend');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      staffId: searchParams.get('staffId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      isWeekend: isWeekendParam !== null ? isWeekendParam === 'true' : undefined,
    };

    const { items, pagination } = await attendanceService.listAttendance(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}
