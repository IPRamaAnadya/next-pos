import { NextRequest } from 'next/server';
import { StaffController } from '../../../../../../../../presentation/controllers/StaffController';

// Use singleton to prevent memory leaks
const getStaffController = () => StaffController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const staffController = getStaffController();
  return await staffController.getStaffSalary(req, id);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const staffController = getStaffController();
  return await staffController.createOrUpdateStaffSalary(req, id);
}