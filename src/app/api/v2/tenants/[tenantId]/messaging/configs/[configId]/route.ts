/**
 * API Routes: /api/v2/tenants/[tenantId]/messaging/configs/[configId]
 * GET - Get config by ID
 * PUT - Update config
 * DELETE - Delete config
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; configId: string }> }
) {
  const { tenantId, configId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getMessagingConfigById(request, tenantId, configId);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; configId: string }> }
) {
  const { tenantId, configId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.updateMessagingConfig(request, tenantId, configId);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; configId: string }> }
) {
  const { tenantId, configId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.deleteMessagingConfig(request, tenantId, configId);
}
