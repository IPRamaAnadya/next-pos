import { NextRequest } from 'next/server';
import { AttendanceController } from '@/presentation/controllers/AttendanceController';
import { apiResponse } from '@/app/api/utils/response';

const attendanceController = new AttendanceController();

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (staffId) {
      // Get attendances by staff
      const result = await attendanceController.getAttendancesByStaff(
        staffId,
        startDate || undefined,
        endDate || undefined
      );
      return apiResponse.success({ data: result.data, message: 'Attendances retrieved successfully' });
    } else {
      // Get attendances by tenant
      const result = await attendanceController.getAttendancesByTenant(
        request,
        startDate || undefined,
        endDate || undefined
      );
      return apiResponse.success({ data: result.data, message: 'Attendances retrieved successfully' });
    }
  } catch (error) {
    console.error('GET /api/v2/attendance error:', error);
    return apiResponse.internalError();
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const result = await attendanceController.createAttendance(request);
    return apiResponse.success({ data: result.data, message: 'Attendance created successfully' });
  } catch (error) {
    console.error('POST /api/v2/attendance error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to create attendance'
    }]);
  }
}