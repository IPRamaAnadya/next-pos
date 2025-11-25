import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';

/**
 * GET /api/v2/tenants/[tenantId]/push-notifications/history
 * Get notification history for a tenant
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const category = searchParams.get('category');

    const controller = new PushNotificationController();
    
    let notifications;
    if (category) {
      notifications = await controller.getNotificationsByCategory(tenantId, category, limit);
    } else {
      notifications = await controller.getNotifications(tenantId, limit);
    }

    return apiResponse.success({
      data: notifications,
      message: 'Notification history retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
