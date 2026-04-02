import { NextRequest } from 'next/server';
import { orderStatusService } from '@/v3/modules/order/order.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ statusId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { statusId } = await params;
    const data = await orderStatusService.getOrderStatus(statusId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can update order statuses');

    const { statusId } = await params;
    const body = await request.json();
    const { code, name, order, isFinal, isActive } = body;

    const data = await orderStatusService.updateOrderStatus(statusId, payload.tenantId, {
      code,
      name,
      order: order !== undefined ? Number(order) : undefined,
      isFinal,
      isActive,
    });
    return apiResponse.success({ data, message: 'Order status updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete order statuses');

    const { statusId } = await params;
    await orderStatusService.deleteOrderStatus(statusId, payload.tenantId);
    return apiResponse.success({ message: 'Order status deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
