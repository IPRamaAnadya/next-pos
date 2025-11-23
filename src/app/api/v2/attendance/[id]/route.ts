import { NextRequest } from 'next/server';
import { AttendanceController } from '@/presentation/controllers/AttendanceController';
import { apiResponse } from '@/app/api/utils/response';

const attendanceController = new AttendanceController();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { id } = await params;
    const result = await attendanceController.getAttendanceById(id);
    
    if (!result.data) {
      return apiResponse.notFound('Attendance not found');
    }
    
    return apiResponse.success({ data: result.data, message: 'Attendance retrieved successfully' });
  } catch (error) {
    console.error('GET /api/v2/attendance/[id] error:', error);
    return apiResponse.internalError();
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { id } = await params;
    const result = await attendanceController.updateAttendance(request, id);
    return apiResponse.success({ data: result.data, message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('PUT /api/v2/attendance/[id] error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to update attendance'
    }]);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { id } = await params;
    const result = await attendanceController.deleteAttendance(id);
    return apiResponse.success({ data: null, message: result.message });
  } catch (error) {
    console.error('DELETE /api/v2/attendance/[id] error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to delete attendance'
    }]);
  }
}