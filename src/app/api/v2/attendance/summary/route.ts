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

    if (!staffId || !startDate || !endDate) {
      return apiResponse.validationError([{
        field: 'query',
        message: 'staffId, startDate, and endDate are required'
      }]);
    }

    const result = await attendanceController.getAttendanceSummary(staffId, startDate, endDate);
    
    return apiResponse.success({ 
      data: result.data, 
      message: 'Attendance summary retrieved successfully' 
    });
  } catch (error) {
    console.error('GET /api/v2/attendance/summary error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to retrieve attendance summary'
    }]);
  }
}