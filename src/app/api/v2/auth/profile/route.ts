import { NextRequest } from 'next/server';
import { AuthController } from '../../../../../presentation/controllers/AuthController';

// Use singleton to prevent memory leaks
const getAuthController = () => AuthController.getInstance();

export async function GET(req: NextRequest) {
  const authController = getAuthController();
  return await authController.getUserProfile(req);
}