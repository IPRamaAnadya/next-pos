import { NextRequest } from 'next/server';
import { expenseCategoryService } from '@/v3/modules/expense/expense.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ categoryId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { categoryId } = await params;
    const data = await expenseCategoryService.getCategory(categoryId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can update expense categories');

    const { categoryId } = await params;
    const body = await request.json();
    const { name, code, isPrivate } = body;

    const data = await expenseCategoryService.updateCategory(categoryId, payload.tenantId, {
      name,
      code,
      isPrivate,
    });
    return apiResponse.success({ data, message: 'Expense category updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete expense categories');

    const { categoryId } = await params;
    await expenseCategoryService.deleteCategory(categoryId, payload.tenantId);
    return apiResponse.success({ message: 'Expense category deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
