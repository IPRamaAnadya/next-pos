import { NextRequest } from 'next/server';
import { staffService } from '@/v3/modules/staff/staff.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ staffId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId } = await params;
    const type = request.nextUrl.searchParams.get('type') ?? undefined;
    const data = await staffService.getStaffLeaves(staffId, payload.tenantId, type);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId } = await params;
    const body = await request.json();
    const { type, reason, startDate, endDate } = body;

    if (!type) return apiResponse.validationError([{ field: 'type', message: 'Leave type is required' }]);
    if (!startDate) return apiResponse.validationError([{ field: 'startDate', message: 'startDate is required' }]);
    if (!endDate) return apiResponse.validationError([{ field: 'endDate', message: 'endDate is required' }]);

    const data = await staffService.createStaffLeave(staffId, payload.tenantId, {
      type,
      reason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    return apiResponse.success({ data, message: 'Leave record created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
