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
  return await staffController.getStaffAttendance(req, id);
}