import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const broadcastSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  body: yup.string().required('Body is required'),
  data: yup.object().optional(),
  imageUrl: yup.string().url().optional(),
  category: yup.string().optional(),
  eventType: yup.string().optional(),
});

/**
 * POST /api/v2/tenants/[tenantId]/push-notifications/broadcast
 * Broadcast notification to all owners
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const body = await req.json();

    // Validate request body
    await broadcastSchema.validate(body);

    const controller = new PushNotificationController();
    const message = await controller.broadcastToOwners({
      tenantId,
      ...body,
    });

    return apiResponse.success({
      data: message,
      message: 'Broadcast sent successfully',
    });
  } catch (error: any) {
    console.error('Error broadcasting notification:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
