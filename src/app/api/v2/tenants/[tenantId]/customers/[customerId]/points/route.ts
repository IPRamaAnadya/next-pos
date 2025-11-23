import { NextRequest } from 'next/server';
import { CustomerController } from '../../../../../../../../presentation/controllers/CustomerController';

// Use singleton to prevent memory leaks
const getCustomerController = () => CustomerController.getInstance();

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; customerId: string } }
) {
  const { tenantId, customerId } = await params;
  const customerController = getCustomerController();
  return await customerController.updateCustomerPoints(req, tenantId, customerId);
}

