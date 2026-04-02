import { NextRequest } from 'next/server';
import { staffService } from '@/v3/modules/staff/staff.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ staffId: string; leaveId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId, leaveId } = await params;
    const data = await staffService.getStaffLeave(leaveId, staffId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId, leaveId } = await params;
    const body = await request.json();
    const { type, reason, startDate, endDate } = body;

    const data = await staffService.updateStaffLeave(leaveId, staffId, payload.tenantId, {
      type,
      reason,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return apiResponse.success({ data, message: 'Leave record updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { staffId, leaveId } = await params;
    await staffService.deleteStaffLeave(leaveId, staffId, payload.tenantId);
    return apiResponse.success({ message: 'Leave record deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
