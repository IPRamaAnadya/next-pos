/**
 * API Routes: /api/v2/tenants/[tenantId]/messaging/settings
 * GET - Get notification settings
 * PUT - Update notification settings
 */

import { NextResponse } from "next/server";
import { GetNotificationSettingsUseCase } from "@/application/use-cases/customer-messaging/GetNotificationSettingsUseCase";
import { UpdateNotificationSettingsUseCase } from "@/application/use-cases/customer-messaging/UpdateNotificationSettingsUseCase";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    // Initialize use case
    const getSettingsUseCase = new GetNotificationSettingsUseCase();

    // Get settings
    const settings = await getSettingsUseCase.execute(tenantId);

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: "Notification settings not found",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // Initialize use case
    const updateSettingsUseCase = new UpdateNotificationSettingsUseCase();

    // Update settings
    const settings = await updateSettingsUseCase.execute({
      tenantId,
      ...body,
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 }
    );
  }
}
