import { NextRequest } from 'next/server';
import { staffService } from '@/v3/modules/staff/staff.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ staffId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId } = await params;
    const data = await staffService.getStaffSalary(staffId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can manage salary');

    const { staffId } = await params;
    const body = await request.json();
    const { basicSalary, fixedAllowance, type } = body;

    if (basicSalary == null) {
      return apiResponse.validationError([{ field: 'basicSalary', message: 'basicSalary is required' }]);
    }

    const data = await staffService.upsertStaffSalary(staffId, payload.tenantId, {
      basicSalary: Number(basicSalary),
      fixedAllowance: fixedAllowance !== undefined ? Number(fixedAllowance) : undefined,
      type,
    });
    return apiResponse.success({ data, message: 'Salary updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can manage salary');

    const { staffId } = await params;
    await staffService.deleteStaffSalary(staffId, payload.tenantId);
    return apiResponse.success({ message: 'Salary record deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
