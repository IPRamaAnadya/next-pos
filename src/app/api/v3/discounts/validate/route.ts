import { NextRequest } from 'next/server';
import { discountService } from '@/v3/modules/discount/discount.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const body = await request.json();
    const { discountId, code, orderAmount, isMemberCustomer } = body;

    if (orderAmount === undefined || orderAmount === null) {
      return apiResponse.validationError([{ field: 'orderAmount', message: 'orderAmount is required' }]);
    }
    if (!discountId && !code) {
      return apiResponse.validationError([{ field: 'discountId', message: 'Provide either discountId or code' }]);
    }

    const result = await discountService.validateDiscount(payload.tenantId, {
      discountId,
      code,
      orderAmount: Number(orderAmount),
      isMemberCustomer: isMemberCustomer ?? false,
    });

    if (!result.isValid) {
      return apiResponse.validationError([{ field: 'discount', message: result.reason ?? 'Discount is not valid' }]);
    }

    return apiResponse.success({ data: result, message: 'Discount is valid' });
  } catch (error) {
    return handleAuthError(error);
  }
}
