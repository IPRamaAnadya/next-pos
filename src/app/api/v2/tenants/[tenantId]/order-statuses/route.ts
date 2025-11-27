import { NextRequest } from 'next/server';
import { OrderStatusController } from '@/presentation/controllers/OrderStatusController';

const getOrderStatusController = () => OrderStatusController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const controller = getOrderStatusController();
  return await controller.getOrderStatuses(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const controller = getOrderStatusController();
  return await controller.createOrderStatus(req, tenantId);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const controller = getOrderStatusController();
  return await controller.reorderOrderStatuses(req, tenantId);
}
