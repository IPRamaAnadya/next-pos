/**
 * API Route: POST /api/v2/tenants/[tenantId]/messaging/send-custom
 * Send custom notification to a list of customers
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SendMessageWithTemplateUseCase } from "@/application/use-cases/CustomerMessagingUseCases";
import { PrismaMessageTemplateRepository } from "@/infrastructure/repositories/PrismaMessageTemplateRepository";
import { PrismaMessagingConfigRepository } from "@/infrastructure/repositories/PrismaMessagingConfigRepository";
import { PrismaMessageLogRepository } from "@/infrastructure/repositories/PrismaMessageLogRepository";
import { MessagingProviderFactory } from "@/infrastructure/services/MessagingProviderFactory";
import { fixPhoneNumber } from "@/lib/notificationUtils";

interface SendCustomNotificationBody {
  customerIds?: string[]; // Optional list of customer IDs
  phoneNumbers?: string[]; // Optional list of phone numbers
  templateId?: string; // Optional template ID
  message?: string; // Optional direct message (if no template)
  variables?: Record<string, string>; // Variables for template
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body: SendCustomNotificationBody = await request.json();

    const { customerIds, phoneNumbers, templateId, message, variables } = body;

    // Validate input
    if (!customerIds?.length && !phoneNumbers?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Either customerIds or phoneNumbers must be provided",
        },
        { status: 400 }
      );
    }

    if (!templateId && !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Either templateId or message must be provided",
        },
        { status: 400 }
      );
    }

    // Get config to determine provider
    let config = await prisma.tenantNotificationConfig.findUnique({
      where: { tenantId },
    });

    // If no config exists, create a default one
    if (!config) {
      config = await prisma.tenantNotificationConfig.create({
        data: {
          tenantId,
          provider: "fonnte",
          apiToken: "",
          apiUrl: "https://api.fonnte.com/send",
          isActive: false,
        },
      });
    }

    if (!config.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification config is not active. Please configure your messaging provider first.",
        },
        { status: 400 }
      );
    }

    if (!config.apiToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification config incomplete. Please add your API token.",
        },
        { status: 400 }
      );
    }

    // Get phone numbers from customer IDs if provided
    let recipientPhones: string[] = [];
    
    // Add provided phone numbers (normalized)
    if (phoneNumbers?.length) {
      console.log('Processing provided phone numbers:', phoneNumbers);
      const normalized = phoneNumbers
        .map((phone) => {
          const fixed = fixPhoneNumber(phone);
          console.log(`Phone: ${phone} → ${fixed} (length: ${fixed.length})`);
          return fixed;
        })
        .filter((phone) => phone && phone.length >= 10); // Valid phone should be at least 10 digits
      
      console.log('Normalized phone numbers:', normalized);
      recipientPhones = normalized;
    }
    
    if (customerIds?.length) {
      console.log('Processing customer IDs:', customerIds);
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
        },
        select: { 
          id: true,
          name: true,
          phone: true 
        },
      });
      
      console.log('Found customers:', customers);
      
      // Check for customers without phone numbers
      const customersWithoutPhone = customers.filter(c => !c.phone);
      if (customersWithoutPhone.length > 0) {
        console.warn('⚠️ Customers without phone numbers:', 
          customersWithoutPhone.map(c => `${c.name} (${c.id})`).join(', ')
        );
      }
      
      const customerPhones = customers
        .map((c) => c.phone)
        .filter((phone): phone is string => !!phone)
        .map((phone) => {
          const fixed = fixPhoneNumber(phone);
          console.log(`Customer phone: ${phone} → ${fixed} (length: ${fixed.length})`);
          return fixed;
        })
        .filter((phone) => phone && phone.length >= 10);
      
      console.log('Customer phone numbers:', customerPhones);
      recipientPhones = [...recipientPhones, ...customerPhones];
    }

    // Remove duplicates
    recipientPhones = Array.from(new Set(recipientPhones));
    
    console.log('Final recipient phones:', recipientPhones);

    if (!recipientPhones.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid phone numbers found. Customers may not have phone numbers in their profile. Please add phone numbers to customer profiles or provide phone numbers directly in the request.",
        },
        { status: 400 }
      );
    }

    // Initialize use case
    const templateRepository = PrismaMessageTemplateRepository.getInstance();
    const configRepository = PrismaMessagingConfigRepository.getInstance();
    const logRepository = PrismaMessageLogRepository.getInstance();
    const providerFactory = MessagingProviderFactory.getInstance();

    const sendMessageUseCase = SendMessageWithTemplateUseCase.getInstance(
      logRepository,
      configRepository,
      templateRepository,
      providerFactory
    );

    // Send notifications to all recipients
    const results = await Promise.allSettled(
      recipientPhones.map((phone) =>
        templateId
          ? sendMessageUseCase.execute({
              tenantId,
              provider: config.provider as any,
              templateId,
              recipient: phone,
              variables: variables || {},
            })
          : // If no template, send direct message
            prisma.notificationLog.create({
              data: {
                tenantId,
                recipient: phone,
                message: message!,
                status: "success",
              },
            })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    
    // Log errors for debugging
    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason);
    
    if (errors.length > 0) {
      console.error("❌ Notification errors:", errors);
    }

    return NextResponse.json({
      success: true,
      data: {
        total: recipientPhones.length,
        succeeded,
        failed,
        recipients: recipientPhones,
        errors: errors.map(e => e instanceof Error ? e.message : String(e)),
      },
    });
  } catch (error) {
    console.error("Error sending custom notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send notification",
      },
      { status: 500 }
    );
  }
}
