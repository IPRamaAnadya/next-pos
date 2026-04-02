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
    const { operation, points } = body;

    if (!operation || !['set', 'add', 'deduct'].includes(operation)) {
      return apiResponse.validationError([
        { field: 'operation', message: 'operation must be set, add, or deduct' },
      ]);
    }
    if (points === undefined || points === null) {
      return apiResponse.validationError([{ field: 'points', message: 'points is required' }]);
    }

    const data = await customerService.updatePoints(customerId, payload.tenantId, {
      operation,
      points: Number(points),
    });

    return apiResponse.success({ data, message: 'Points updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
