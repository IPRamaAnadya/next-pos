import { NextRequest } from 'next/server';
import { TenantController } from '@/presentation/controllers/TenantController';

// Use singleton to prevent memory leaks
const getTenantController = () => TenantController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = await params;
  const tenantController = getTenantController();
  return await tenantController.getActiveTenantsByUserId(req, userId);
}