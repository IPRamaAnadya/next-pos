import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    if (payload.type === 'staff') {
      const profile = await authService.getStaffProfile(payload.staffId, payload.tenantId);
      return apiResponse.success({ data: profile });
    }

    const profile = await authService.getOwnerProfile(payload.userId, payload.tenantId);
    return apiResponse.success({ data: profile });
  } catch (error) {
    return handleAuthError(error);
  }
}
