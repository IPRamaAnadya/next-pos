import { NextRequest } from 'next/server';
import { customerService } from '@/v3/modules/customer/customer.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ customerId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { customerId } = await params;

    const body = await request.json();
    const { membershipExpiredAt } = body;

    if (!membershipExpiredAt) {
      return apiResponse.validationError([
        { field: 'membershipExpiredAt', message: 'membershipExpiredAt is required' },
      ]);
    }

    const data = await customerService.extendMembership(customerId, payload.tenantId, {
      membershipExpiredAt: new Date(membershipExpiredAt),
    });

    return apiResponse.success({ data, message: 'Membership extended successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
