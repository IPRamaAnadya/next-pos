import { NextRequest } from 'next/server';
import { expenseCategoryService } from '@/v3/modules/expense/expense.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isPrivateParam = searchParams.get('isPrivate');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      isPrivate: isPrivateParam !== null ? isPrivateParam === 'true' : undefined,
    };

    const { items, pagination } = await expenseCategoryService.listCategories(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can create expense categories');

    const body = await request.json();
    const { name, code, isPrivate } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Category name is required' }]);
    if (!code) return apiResponse.validationError([{ field: 'code', message: 'Category code is required' }]);

    const data = await expenseCategoryService.createCategory(payload.tenantId, { name, code, isPrivate });
    return apiResponse.success({ data, message: 'Expense category created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
