import { NextRequest } from 'next/server';
import { tenantService } from '@/v3/modules/tenant/tenant.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const data = await tenantService.getTenant(payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    if (payload.type !== 'owner') {
      return apiResponse.forbidden('Only the store owner can update store information');
    }

    const body = await request.json();
    const { name, address, phone } = body;

    const data = await tenantService.updateTenant(payload.tenantId, payload.userId, { name, address, phone });
    return apiResponse.success({ data, message: 'Store updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
