/**
 * API Routes: /api/v2/tenants/[tenantId]/messaging/configs
 * GET - Get all messaging configurations
 * POST - Create a new messaging configuration
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getMessagingConfigs(request, tenantId);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.createMessagingConfig(request, tenantId);
}
