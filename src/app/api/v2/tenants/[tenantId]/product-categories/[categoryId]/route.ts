import { NextRequest } from 'next/server';
import { ProductCategoryController } from '@/presentation/controllers/ProductCategoryController';

// Use singleton to prevent memory leaks
const getCategoryController = () => ProductCategoryController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; categoryId: string } }
) {
  const { tenantId, categoryId } = await params;
  const categoryController = getCategoryController();
  return await categoryController.getCategoryById(req, tenantId, categoryId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; categoryId: string } }
) {
  const { tenantId, categoryId } = await params;
  const categoryController = getCategoryController();
  return await categoryController.updateCategory(req, tenantId, categoryId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; categoryId: string } }
) {
  const { tenantId, categoryId } = await params;
  const categoryController = getCategoryController();
  return await categoryController.deleteCategory(req, tenantId, categoryId);
}