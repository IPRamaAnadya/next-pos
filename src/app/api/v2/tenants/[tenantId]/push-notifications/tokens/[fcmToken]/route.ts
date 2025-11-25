import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const deactivateTokenSchema = yup.object().shape({
  fcmToken: yup.string().required('FCM token is required'),
});

/**
 * DELETE /api/v2/tenants/[tenantId]/push-notifications/tokens/[fcmToken]
 * Deactivate an FCM token
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; fcmToken: string }> }
) {
  try {
    const { fcmToken } = await context.params;

    const controller = new PushNotificationController();
    await controller.deactivateToken(fcmToken);

    return apiResponse.success({
      message: 'FCM token deactivated successfully',
    });
  } catch (error: any) {
    console.error('Error deactivating FCM token:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
