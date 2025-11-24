import { NextRequest } from 'next/server';
import { StaffController } from '@/presentation/controllers/StaffController';

// Use singleton to prevent memory leaks
const getStaffController = () => StaffController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const staffController = getStaffController();
  return await staffController.getById(req, id);
}

export async function PUT(
  req: NextRequest,
  paramsPromise: Promise<{ params: { id: string } }>
) {
  const { params } = await paramsPromise;
  const { id } = params;
  const staffController = getStaffController();
  return await staffController.update(req, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const staffController = getStaffController();
  return await staffController.delete(req, id);
}