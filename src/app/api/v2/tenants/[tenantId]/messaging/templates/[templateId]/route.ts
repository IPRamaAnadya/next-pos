/**
 * API Routes: /api/v2/tenants/[tenantId]/messaging/templates/[templateId]
 * GET - Get template by ID
 * PUT - Update template
 * DELETE - Delete template
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; templateId: string }> }
) {
  const { tenantId, templateId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getMessageTemplateById(request, tenantId, templateId);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; templateId: string }> }
) {
  const { tenantId, templateId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.updateMessageTemplate(request, tenantId, templateId);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; templateId: string }> }
) {
  const { tenantId, templateId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.deleteMessageTemplate(request, tenantId, templateId);
}
