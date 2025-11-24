import { NextRequest } from 'next/server';
import { ProductController } from '@/presentation/controllers/ProductController';

// Use singleton to prevent memory leaks
const getProductController = () => ProductController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const productController = getProductController();
  return await productController.getProducts(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const productController = getProductController();
  return await productController.createProduct(req, tenantId);
}