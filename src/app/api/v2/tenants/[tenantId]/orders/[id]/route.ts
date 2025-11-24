import { NextRequest } from 'next/server';
import { OrderController } from '@/presentation/controllers/OrderController';

// Use singleton to prevent memory leaks
const getOrderController = () => OrderController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const orderController = getOrderController();
  return await orderController.getOrderById(req, tenantId, id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const orderController = getOrderController();
  return await orderController.updateOrder(req, tenantId, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const orderController = getOrderController();
  return await orderController.deleteOrder(req, tenantId, id);
}