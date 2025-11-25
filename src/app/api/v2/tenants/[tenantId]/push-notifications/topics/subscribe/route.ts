import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const subscribeSchema = yup.object().shape({
  tokenId: yup.string().required('Token ID is required'),
  topic: yup.string().required('Topic is required'),
});

/**
 * POST /api/v2/tenants/[tenantId]/push-notifications/topics/subscribe
 * Subscribe a token to a topic
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const body = await req.json();

    // Validate request body
    await subscribeSchema.validate(body);

    const controller = new PushNotificationController();
    await controller.subscribeToTopic({
      tenantId,
      ...body,
    });

    return apiResponse.success({
      message: 'Subscribed to topic successfully',
    });
  } catch (error: any) {
    console.error('Error subscribing to topic:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
