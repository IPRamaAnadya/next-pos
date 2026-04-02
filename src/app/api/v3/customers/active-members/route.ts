import { NextRequest } from 'next/server';
import { customerService } from '@/v3/modules/customer/customer.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const count = await customerService.getActiveMembersCount(payload.tenantId);
    return apiResponse.success({ data: { count } });
  } catch (error) {
    return handleAuthError(error);
  }
}
