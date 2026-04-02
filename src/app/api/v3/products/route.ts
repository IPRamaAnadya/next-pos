import { NextRequest } from 'next/server';
import { productService } from '@/v3/modules/product/product.service';
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
      categoryId: searchParams.get('categoryId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'stock' | 'createdAt') ?? undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? undefined,
    };

    const { items, pagination } = await productService.listProducts(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const body = await request.json();
    const { name, description, price, type, stock, sku, imageUrl, alias, productCategoryId, isCountable, unit } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Product name is required' }]);
    if (price === undefined || price === null)
      return apiResponse.validationError([{ field: 'price', message: 'Price is required' }]);
    if (!type || !['good', 'service'].includes(type))
      return apiResponse.validationError([{ field: 'type', message: 'Type must be good or service' }]);

    const data = await productService.createProduct(payload.tenantId, {
      name,
      description,
      price: Number(price),
      type,
      stock,
      sku,
      imageUrl,
      alias,
      productCategoryId,
      isCountable,
      unit,
    });

    return apiResponse.success({ data, message: 'Product created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
