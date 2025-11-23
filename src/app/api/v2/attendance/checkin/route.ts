import { NextRequest } from 'next/server';
import { AttendanceController } from '@/presentation/controllers/AttendanceController';
import { apiResponse } from '@/app/api/utils/response';

const attendanceController = new AttendanceController();

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const result = await attendanceController.checkIn(request);
    return apiResponse.success({ 
      data: result.data, 
      message: 'Check-in successful' 
    });
  } catch (error) {
    console.error('POST /api/v2/attendance/checkin error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to check in'
    }]);
  }
}