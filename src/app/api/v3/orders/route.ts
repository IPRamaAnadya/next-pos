import { NextRequest } from 'next/server';
import { orderService } from '@/v3/modules/order/order.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      paymentStatus: searchParams.get('paymentStatus') ?? undefined,
      orderStatus: searchParams.get('orderStatus') ?? undefined,
      staffId: searchParams.get('staffId') ?? undefined,
      customerId: searchParams.get('customerId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    };

    const { items, pagination } = await orderService.listOrders(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const body = await request.json();
    const {
      items, paidAmount, paymentMethod, paymentDate, note,
      customerId, customerName, staffId, discountId, discountCode,
      taxAmount, pointUsed, lastPointsAccumulation, orderStatus,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiResponse.validationError([{ field: 'items', message: 'At least one item is required' }]);
    }
    if (paidAmount == null) {
      return apiResponse.validationError([{ field: 'paidAmount', message: 'paidAmount is required' }]);
    }

    const data = await orderService.createOrder(payload.tenantId, {
      items,
      paidAmount: Number(paidAmount),
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      note,
      customerId,
      customerName,
      staffId,
      discountId,
      discountCode,
      taxAmount: taxAmount !== undefined ? Number(taxAmount) : undefined,
      pointUsed: pointUsed !== undefined ? Number(pointUsed) : undefined,
      lastPointsAccumulation: lastPointsAccumulation !== undefined ? Number(lastPointsAccumulation) : undefined,
      orderStatus,
    });
    return apiResponse.success({ data, message: 'Order created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
