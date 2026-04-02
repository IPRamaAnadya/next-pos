import { NextRequest } from 'next/server';
import { staffService } from '@/v3/modules/staff/staff.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isOwnerParam = searchParams.get('isOwner');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      isOwner: isOwnerParam !== null ? isOwnerParam === 'true' : undefined,
    };

    const { items, pagination } = await staffService.listStaff(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can create staff');

    const body = await request.json();
    const { username, password, role, isOwner } = body;

    if (!username) return apiResponse.validationError([{ field: 'username', message: 'Username is required' }]);
    if (!password) return apiResponse.validationError([{ field: 'password', message: 'Password is required' }]);
    if (!role) return apiResponse.validationError([{ field: 'role', message: 'Role is required' }]);

    const data = await staffService.createStaff(payload.tenantId, { username, password, role, isOwner });
    return apiResponse.success({ data, message: 'Staff created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
