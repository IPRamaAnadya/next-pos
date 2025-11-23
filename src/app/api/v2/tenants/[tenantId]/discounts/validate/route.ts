import { NextRequest } from 'next/server';
import { DiscountController } from '../../../../../../../presentation/controllers/DiscountController';

// Use singleton to prevent memory leaks
const getDiscountController = () => DiscountController.getInstance();

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const discountController = getDiscountController();
  return await discountController.validateDiscount(req, tenantId);
}