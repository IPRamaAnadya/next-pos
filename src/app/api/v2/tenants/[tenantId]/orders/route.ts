import { NextRequest } from 'next/server';
import { OrderController } from '@/presentation/controllers/OrderController';

// Use singleton to prevent memory leaks
const getOrderController = () => OrderController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const orderController = getOrderController();
  return await orderController.getOrders(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const orderController = getOrderController();
  return await orderController.createOrder(req, tenantId);
}