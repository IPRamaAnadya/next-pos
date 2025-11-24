import { NextRequest } from 'next/server';
import { StaffController } from '@/presentation/controllers/StaffController';

// Use singleton to prevent memory leaks
const getStaffController = () => StaffController.getInstance();

export async function GET(req: NextRequest) {
  const staffController = getStaffController();
  return await staffController.getAll(req);
}

export async function POST(req: NextRequest) {
  const staffController = getStaffController();
  return await staffController.create(req);
}