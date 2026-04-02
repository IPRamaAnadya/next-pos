import { NextRequest } from 'next/server';
import { productService } from '@/v3/modules/product/product.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const { searchParams } = request.nextUrl;
    const parentIdParam = searchParams.get('parentId');
    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      // parentId=root returns root categories, parentId=<uuid> returns children, omit to get all
      parentId: parentIdParam === 'root' ? null : (parentIdParam ?? undefined),
    };

    const { items, pagination } = await productService.listCategories(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Category name is required' }]);

    const data = await productService.createCategory(payload.tenantId, { name, description, parentId });
    return apiResponse.success({ data, message: 'Category created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
