import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationController } from '@/presentation/controllers/PushNotificationController';
import { apiResponse } from '@/app/api/utils/response';
import * as yup from 'yup';

const sendNotificationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  body: yup.string().required('Body is required'),
  data: yup.object().optional(),
  imageUrl: yup.string().url().optional(),
  targetType: yup
    .string()
    .oneOf(['token', 'topic', 'condition', 'broadcast'])
    .required('Target type is required'),
  targetValue: yup.string().when('targetType', {
    is: (val: string) => ['token', 'topic', 'condition'].includes(val),
    then: (schema) => schema.required('Target value is required for this target type'),
    otherwise: (schema) => schema.optional(),
  }),
  category: yup.string().optional(),
  eventType: yup.string().optional(),
  priority: yup.string().oneOf(['high', 'normal']).optional(),
});

/**
 * POST /api/v2/tenants/[tenantId]/push-notifications/send
 * Send a push notification
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const body = await req.json();

    // Validate request body
    await sendNotificationSchema.validate(body);

    const controller = new PushNotificationController();
    const message = await controller.sendNotification({
      tenantId,
      ...body,
    });

    return apiResponse.success({
      data: message,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { meta: { status: 400, message: error.message }, data: null },
      { status: 400 }
    );
  }
}
