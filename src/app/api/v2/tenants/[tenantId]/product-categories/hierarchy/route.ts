import { NextRequest } from 'next/server';
import { ProductCategoryController } from '@/presentation/controllers/ProductCategoryController';

// Use singleton to prevent memory leaks
const getCategoryController = () => ProductCategoryController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const categoryController = getCategoryController();
  return await categoryController.getCategoryHierarchy(req, tenantId);
}