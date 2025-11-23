import { NextRequest } from 'next/server';
import { ProductCategoryController } from '../../../../../../../../presentation/controllers/ProductCategoryController';

// Use singleton to prevent memory leaks
const getCategoryController = () => ProductCategoryController.getInstance();

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; categoryId: string } }
) {
  const { tenantId, categoryId } = await params;
  const categoryController = getCategoryController();
  return await categoryController.moveCategory(req, tenantId, categoryId);
}