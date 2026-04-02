import { NextRequest } from 'next/server';
import { orderStatusService } from '@/v3/modules/order/order.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isActiveParam = searchParams.get('isActive');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
    };

    const { items, pagination } = await orderStatusService.listOrderStatuses(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can create order statuses');

    const body = await request.json();
    const { code, name, order, isFinal, isActive } = body;

    if (!code) {
      return apiResponse.validationError([{ field: 'code', message: 'code is required' }]);
    }
    if (!name) {
      return apiResponse.validationError([{ field: 'name', message: 'name is required' }]);
    }
    if (order == null) {
      return apiResponse.validationError([{ field: 'order', message: 'order is required' }]);
    }

    const data = await orderStatusService.createOrderStatus(payload.tenantId, {
      code,
      name,
      order: Number(order),
      isFinal,
      isActive,
    });
    return apiResponse.success({ data, message: 'Order status created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
