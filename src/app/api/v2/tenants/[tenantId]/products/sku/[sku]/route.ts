import { NextRequest } from 'next/server';
import { ProductController } from '../../../../../../../presentation/controllers/ProductController';

// Use singleton to prevent memory leaks
const getProductController = () => ProductController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; sku: string } }
) {
  const { tenantId, sku } = await params;
  const productController = getProductController();
  return await productController.getProductBySku(req, tenantId, sku);
}