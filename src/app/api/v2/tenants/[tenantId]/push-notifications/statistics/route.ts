import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';

/**
 * GET /api/v2/tenants/[tenantId]/push-notifications/statistics
 * Get notification statistics
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const { searchParams } = new URL(req.url);
    
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    const controller = new PushNotificationController();
    const statistics = await controller.getStatistics(tenantId, dateFrom, dateTo);

    return apiResponse.success({
      data: statistics,
      message: 'Statistics retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
