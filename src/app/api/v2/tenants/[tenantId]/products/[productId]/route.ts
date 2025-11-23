import { NextRequest } from 'next/server';
import { ProductController } from '../../../../../../../presentation/controllers/ProductController';

// Use singleton to prevent memory leaks
const getProductController = () => ProductController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  const { tenantId, productId } = await params;
  const productController = getProductController();
  return await productController.getProductById(req, tenantId, productId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  const { tenantId, productId } = await params;
  const productController = getProductController();
  return await productController.updateProduct(req, tenantId, productId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  const { tenantId, productId } = await params;
  const productController = getProductController();
  return await productController.deleteProduct(req, tenantId, productId);
}