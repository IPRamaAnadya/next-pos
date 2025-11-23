import { NextRequest } from 'next/server';
import { DiscountController } from '../../../../../../../../presentation/controllers/DiscountController';

// Use singleton to prevent memory leaks
const getDiscountController = () => DiscountController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; code: string } }
) {
  const { tenantId, code } = await params;
  const discountController = getDiscountController();
  return await discountController.findDiscountByCode(req, tenantId, code);
}