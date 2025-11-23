/**
 * API Route: POST /api/v2/tenants/[tenantId]/messaging/send
 * Send a direct message
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.sendMessage(request, tenantId);
}
