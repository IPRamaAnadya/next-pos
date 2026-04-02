import { NextRequest } from 'next/server';
import { shiftService } from '@/v3/modules/shift/shift.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isActiveParam = searchParams.get('isActive');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
    };

    const { items, pagination } = await shiftService.listShifts(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can create shifts');

    const body = await request.json();
    const {
      name, startTime, endTime, isActive, calculateBeforeStartTime, hasBreakTime,
      breakDuration, minWorkingHours, maxWorkingHours, overtimeMultiplier,
      lateThreshold, earlyCheckInAllowed, color, description,
    } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Shift name is required' }]);
    if (!startTime) return apiResponse.validationError([{ field: 'startTime', message: 'startTime is required' }]);
    if (!endTime) return apiResponse.validationError([{ field: 'endTime', message: 'endTime is required' }]);

    const data = await shiftService.createShift(payload.tenantId, {
      name, startTime, endTime, isActive, calculateBeforeStartTime, hasBreakTime,
      breakDuration, minWorkingHours, maxWorkingHours, overtimeMultiplier,
      lateThreshold, earlyCheckInAllowed, color, description,
    });
    return apiResponse.success({ data, message: 'Shift created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
