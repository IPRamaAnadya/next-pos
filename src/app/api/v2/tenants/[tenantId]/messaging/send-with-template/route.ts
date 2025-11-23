/**
 * API Route: POST /api/v2/tenants/[tenantId]/messaging/send-with-template
 * Send a message using a template
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.sendMessageWithTemplate(request, tenantId);
}
