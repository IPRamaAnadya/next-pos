import { NextRequest } from 'next/server';
import { productService } from '@/v3/modules/product/product.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ productId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { productId } = await params;

    const data = await productService.getProduct(productId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { productId } = await params;

    const body = await request.json();
    const { name, description, price, type, stock, sku, imageUrl, alias, productCategoryId, isCountable, unit } = body;

    if (type !== undefined && !['good', 'service'].includes(type)) {
      return apiResponse.validationError([{ field: 'type', message: 'Type must be good or service' }]);
    }

    const data = await productService.updateProduct(productId, payload.tenantId, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      type,
      stock,
      sku,
      imageUrl,
      alias,
      productCategoryId,
      isCountable,
      unit,
    });

    return apiResponse.success({ data, message: 'Product updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { productId } = await params;

    await productService.deleteProduct(productId, payload.tenantId);
    return apiResponse.success({ message: 'Product deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
