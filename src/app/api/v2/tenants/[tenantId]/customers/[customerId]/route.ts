import { NextRequest } from 'next/server';
import { CustomerController } from '../../../../../../../presentation/controllers/CustomerController';

// Use singleton to prevent memory leaks
const getCustomerController = () => CustomerController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; customerId: string } }
) {
  const { tenantId, customerId } = await params;
  const customerController = getCustomerController();
  return await customerController.getCustomerById(req, tenantId, customerId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; customerId: string } }
) {
  const { tenantId, customerId } = await params;
  const customerController = getCustomerController();
  return await customerController.updateCustomer(req, tenantId, customerId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; customerId: string } }
) {
  const { tenantId, customerId } = await params;
  const customerController = getCustomerController();
  return await customerController.deleteCustomer(req, tenantId, customerId);
}