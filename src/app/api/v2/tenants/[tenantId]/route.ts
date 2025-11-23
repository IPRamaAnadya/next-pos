import { NextRequest } from 'next/server';
import { TenantController } from '../../../../../presentation/controllers/TenantController';

// Use singleton to prevent memory leaks
const getTenantController = () => TenantController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const tenantController = getTenantController();
  return await tenantController.getTenantById(req, tenantId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const tenantController = getTenantController();
  return await tenantController.updateTenant(req, tenantId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const tenantController = getTenantController();
  return await tenantController.deleteTenant(req, tenantId);
}