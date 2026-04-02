import { NextRequest } from 'next/server';
import { productService } from '@/v3/modules/product/product.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ categoryId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { categoryId } = await params;

    const data = await productService.getCategory(categoryId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { categoryId } = await params;

    const body = await request.json();
    const { name, description, parentId } = body;

    const data = await productService.updateCategory(categoryId, payload.tenantId, {
      name,
      description,
      parentId,
    });

    return apiResponse.success({ data, message: 'Category updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { categoryId } = await params;

    await productService.deleteCategory(categoryId, payload.tenantId);
    return apiResponse.success({ message: 'Category deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
