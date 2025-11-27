import { NextRequest } from 'next/server';
import { AdminAuthController } from '@/presentation/controllers/AdminAuthController';

// Use singleton to prevent memory leaks
const getAdminAuthController = () => AdminAuthController.getInstance();

/**
 * GET /api/v2/admin/auth/check
 * Check if any admin account exists in the database
 */
export async function GET(req: NextRequest) {
  const adminAuthController = getAdminAuthController();
  return await adminAuthController.checkAdminExists(req);
}

/**
 * POST /api/v2/admin/auth/check
 * Admin login endpoint
 */
export async function POST(req: NextRequest) {
  const adminAuthController = getAdminAuthController();
  return await adminAuthController.login(req);
}
