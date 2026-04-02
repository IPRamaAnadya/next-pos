import { NextRequest } from 'next/server';
import { tenantService } from '@/v3/modules/tenant/tenant.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const data = await tenantService.getSettings(payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    if (payload.type !== 'owner') {
      return apiResponse.forbidden('Only the store owner can update store settings');
    }

    const body = await request.json();
    const { showDiscount, showTax } = body;

    if (showDiscount !== undefined && typeof showDiscount !== 'boolean') {
      return apiResponse.validationError([{ field: 'showDiscount', message: 'showDiscount must be a boolean' }]);
    }
    if (showTax !== undefined && typeof showTax !== 'boolean') {
      return apiResponse.validationError([{ field: 'showTax', message: 'showTax must be a boolean' }]);
    }

    const data = await tenantService.updateSettings(payload.tenantId, payload.userId, { showDiscount, showTax });
    return apiResponse.success({ data, message: 'Store settings updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
