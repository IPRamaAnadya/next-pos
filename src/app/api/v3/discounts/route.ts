import { NextRequest } from 'next/server';
import { discountService } from '@/v3/modules/discount/discount.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';
import type { DiscountType } from '@/v3/modules/discount/discount.type';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const { searchParams } = request.nextUrl;
    const isActiveParam = searchParams.get('isActive');
    const isMemberOnlyParam = searchParams.get('isMemberOnly');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      type: (searchParams.get('type') as DiscountType) ?? undefined,
      isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
      isMemberOnly: isMemberOnlyParam !== null ? isMemberOnlyParam === 'true' : undefined,
    };

    const { items, pagination } = await discountService.listDiscounts(payload.tenantId, query);
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
      code, name, description, type, value,
      validFrom, validTo, minPurchase, maxDiscount,
      applicableItems, rewardType, isMemberOnly,
    } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Discount name is required' }]);
    if (!type) return apiResponse.validationError([{ field: 'type', message: 'Type is required' }]);
    if (value === undefined || value === null)
      return apiResponse.validationError([{ field: 'value', message: 'Value is required' }]);

    const data = await discountService.createDiscount(payload.tenantId, {
      code,
      name,
      description,
      type,
      value: Number(value),
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
      minPurchase: minPurchase != null ? Number(minPurchase) : null,
      maxDiscount: maxDiscount != null ? Number(maxDiscount) : null,
      applicableItems,
      rewardType,
      isMemberOnly,
    });

    return apiResponse.success({ data, message: 'Discount created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
