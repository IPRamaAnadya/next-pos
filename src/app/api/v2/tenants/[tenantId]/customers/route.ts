import { NextRequest } from 'next/server';
import { CustomerController } from '../../../../../../presentation/controllers/CustomerController';

// Use singleton to prevent memory leaks
const getCustomerController = () => CustomerController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const customerController = getCustomerController();
  return await customerController.getCustomers(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const customerController = getCustomerController();
  return await customerController.createCustomer(req, tenantId);
}