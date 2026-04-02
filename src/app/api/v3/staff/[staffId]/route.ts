import { NextRequest } from 'next/server';
import { staffService } from '@/v3/modules/staff/staff.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ staffId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId } = await params;
    const data = await staffService.getStaff(staffId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can update staff');

    const { staffId } = await params;
    const body = await request.json();
    const { username, password, role } = body;

    const data = await staffService.updateStaff(staffId, payload.tenantId, { username, password, role });
    return apiResponse.success({ data, message: 'Staff updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete staff');

    const { staffId } = await params;
    await staffService.deleteStaff(staffId, payload.tenantId);
    return apiResponse.success({ message: 'Staff deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
