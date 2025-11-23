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
    const result = await attendanceController.suggestShift(id);
    
    return apiResponse.success({ 
      data: result.data, 
      message: 'Shift suggestion retrieved successfully' 
    });
  } catch (error) {
    console.error('GET /api/v2/attendance/[id]/suggest-shift error:', error);
    return apiResponse.validationError([{
      field: 'general',
      message: error instanceof Error ? error.message : 'Failed to suggest shift'
    }]);
  }
}