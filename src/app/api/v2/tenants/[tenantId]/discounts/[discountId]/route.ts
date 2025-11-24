import { NextRequest } from 'next/server';
import { DiscountController } from '@/presentation/controllers/DiscountController';

// Use singleton to prevent memory leaks
const getDiscountController = () => DiscountController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; discountId: string } }
) {
  const { tenantId, discountId } = await params;
  const discountController = getDiscountController();
  return await discountController.getDiscountById(req, tenantId, discountId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; discountId: string } }
) {
  const { tenantId, discountId } = await params;
  const discountController = getDiscountController();
  return await discountController.updateDiscount(req, tenantId, discountId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; discountId: string } }
) {
  const { tenantId, discountId } = await params;
  const discountController = getDiscountController();
  return await discountController.deleteDiscount(req, tenantId, discountId);
}