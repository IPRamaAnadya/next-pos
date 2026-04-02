import { NextRequest } from 'next/server';
import { shiftService } from '@/v3/modules/shift/shift.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const data = await shiftService.listActiveShifts(payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}
