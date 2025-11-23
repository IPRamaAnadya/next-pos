/**
 * API Route: POST /api/v2/tenants/[tenantId]/messaging/configs/[configId]/test
 * Test messaging configuration connection
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; configId: string }> }
) {
  const { tenantId, configId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.testMessagingConfig(request, tenantId, configId);
}
