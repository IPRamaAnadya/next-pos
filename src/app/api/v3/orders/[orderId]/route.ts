import { NextRequest } from 'next/server';
import { orderService } from '@/v3/modules/order/order.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ orderId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { orderId } = await params;
    const data = await orderService.getOrder(orderId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const { paidAmount, paymentMethod, paymentDate, note, staffId, customerName } = body;

    const data = await orderService.updateOrder(orderId, payload.tenantId, {
      paidAmount: paidAmount !== undefined ? Number(paidAmount) : undefined,
      paymentMethod,
      paymentDate: paymentDate !== undefined ? (paymentDate ? new Date(paymentDate) : null) : undefined,
      note,
      staffId,
      customerName,
    });
    return apiResponse.success({ data, message: 'Order updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete orders');

    const { orderId } = await params;
    await orderService.deleteOrder(orderId, payload.tenantId);
    return apiResponse.success({ message: 'Order deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
