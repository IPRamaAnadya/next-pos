import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const unsubscribeSchema = yup.object().shape({
  tokenId: yup.string().required('Token ID is required'),
  topic: yup.string().required('Topic is required'),
});

/**
 * POST /api/v2/tenants/[tenantId]/push-notifications/topics/unsubscribe
 * Unsubscribe a token from a topic
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const body = await req.json();

    // Validate request body
    await unsubscribeSchema.validate(body);

    const controller = new PushNotificationController();
    await controller.unsubscribeFromTopic(body.tokenId, body.topic);

    return apiResponse.success({
      message: 'Unsubscribed from topic successfully',
    });
  } catch (error: any) {
    console.error('Error unsubscribing from topic:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
