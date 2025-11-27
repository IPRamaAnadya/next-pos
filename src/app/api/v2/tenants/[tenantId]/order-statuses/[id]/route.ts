import { NextRequest } from 'next/server';
import { OrderStatusController } from '@/presentation/controllers/OrderStatusController';

const getOrderStatusController = () => OrderStatusController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const controller = getOrderStatusController();
  return await controller.getOrderStatusById(req, tenantId, id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const controller = getOrderStatusController();
  return await controller.updateOrderStatus(req, tenantId, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  const { tenantId, id } = await params;
  const controller = getOrderStatusController();
  return await controller.deleteOrderStatus(req, tenantId, id);
}
