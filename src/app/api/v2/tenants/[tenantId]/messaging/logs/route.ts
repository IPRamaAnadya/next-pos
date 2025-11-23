/**
 * API Route: GET /api/v2/tenants/[tenantId]/messaging/logs
 * Get message logs with filtering and pagination
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getMessageLogs(request, tenantId);
}
