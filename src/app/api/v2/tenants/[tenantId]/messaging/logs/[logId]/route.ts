/**
 * API Route: GET /api/v2/tenants/[tenantId]/messaging/logs/[logId]
 * Get message log by ID
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; logId: string }> }
) {
  const { tenantId, logId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getMessageLogById(request, tenantId, logId);
}
