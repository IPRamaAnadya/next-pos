import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const registerTokenSchema = yup.object().shape({
  fcmToken: yup.string().required('FCM token is required'),
  userId: yup.string().uuid().optional(),
  staffId: yup.string().uuid().optional(),
  deviceType: yup.string().oneOf(['ios', 'android', 'web']).optional(),
  deviceId: yup.string().optional(),
});

/**
 * POST /api/v2/tenants/[tenantId]/push-notifications/tokens
 * Register a new FCM token
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const body = await req.json();

    // Validate request body
    await registerTokenSchema.validate(body);

    const controller = new PushNotificationController();
    const token = await controller.registerToken({
      tenantId,
      ...body,
    });

    return apiResponse.success({
      data: token,
      message: 'FCM token registered successfully',
    });
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}

/**
 * GET /api/v2/tenants/[tenantId]/push-notifications/tokens
 * Get all active tokens for tenant
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;

    const controller = new PushNotificationController();
    const tokens = await controller.getActiveTokens(tenantId);

    return apiResponse.success({
      data: tokens,
      message: 'Active tokens retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching active tokens:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
