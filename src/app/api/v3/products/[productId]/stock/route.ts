import { NextRequest } from 'next/server';
import { productService } from '@/v3/modules/product/product.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ productId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { productId } = await params;

    const body = await request.json();
    const { stock } = body;

    if (stock === undefined || stock === null) {
      return apiResponse.validationError([{ field: 'stock', message: 'Stock value is required' }]);
    }

    if (typeof stock !== 'number' || !Number.isInteger(stock)) {
      return apiResponse.validationError([{ field: 'stock', message: 'Stock must be an integer' }]);
    }

    const data = await productService.updateStock(productId, payload.tenantId, { stock });
    return apiResponse.success({ data, message: 'Stock updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
