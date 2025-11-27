import { NextRequest } from 'next/server';
import { AdminAuthController } from '@/presentation/controllers/AdminAuthController';

// Use singleton to prevent memory leaks
const getAdminAuthController = () => AdminAuthController.getInstance();

/**
 * POST /api/v2/admin/auth/login
 * Admin login endpoint
 */
export async function POST(req: NextRequest) {
  const adminAuthController = getAdminAuthController();
  return await adminAuthController.login(req);
}
