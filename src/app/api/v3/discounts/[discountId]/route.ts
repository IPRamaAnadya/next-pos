import { NextRequest } from 'next/server';
import { discountService } from '@/v3/modules/discount/discount.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ discountId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { discountId } = await params;

    const data = await discountService.getDiscount(discountId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { discountId } = await params;

    const body = await request.json();
    const {
      code, name, description, type, value,
      validFrom, validTo, minPurchase, maxDiscount,
      applicableItems, rewardType, isMemberOnly,
    } = body;

    const data = await discountService.updateDiscount(discountId, payload.tenantId, {
      code,
      name,
      description,
      type,
      value: value !== undefined ? Number(value) : undefined,
      validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : undefined,
      validTo: validTo !== undefined ? (validTo ? new Date(validTo) : null) : undefined,
      minPurchase: minPurchase !== undefined ? (minPurchase != null ? Number(minPurchase) : null) : undefined,
      maxDiscount: maxDiscount !== undefined ? (maxDiscount != null ? Number(maxDiscount) : null) : undefined,
      applicableItems,
      rewardType,
      isMemberOnly,
    });

    return apiResponse.success({ data, message: 'Discount updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { discountId } = await params;

    await discountService.deleteDiscount(discountId, payload.tenantId);
    return apiResponse.success({ message: 'Discount deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
