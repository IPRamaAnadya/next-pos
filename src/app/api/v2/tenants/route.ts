import { NextRequest } from 'next/server';
import { TenantController } from '@/presentation/controllers/TenantController';

// Use singleton to prevent memory leaks
const getTenantController = () => TenantController.getInstance();

export async function GET(req: NextRequest) {
  const tenantController = getTenantController();
  return await tenantController.getTenants(req);
}

export async function POST(req: NextRequest) {
  const tenantController = getTenantController();
  return await tenantController.createTenant(req);
}