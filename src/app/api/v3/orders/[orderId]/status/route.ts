import { NextRequest } from 'next/server';
import { orderService } from '@/v3/modules/order/order.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ orderId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const { status, note, staffId } = body;

    if (!status) {
      return apiResponse.validationError([{ field: 'status', message: 'status is required' }]);
    }

    const data = await orderService.setOrderStatus(orderId, payload.tenantId, {
      status,
      note,
      staffId,
    });
    return apiResponse.success({ data, message: 'Order status updated' });
  } catch (error) {
    return handleAuthError(error);
  }
}
