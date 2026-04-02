/**
 * Presentation Controller: Donation Controller
 * Handles HTTP requests for donation operations
 */

import { NextResponse } from "next/server";
import { apiResponse } from "@/app/api/utils/response";
import {
  CreateDonationUseCase,
  GetDonationDetailUseCase,
  GetTenantDonationsUseCase,
  GetMonthlyDonationSummaryUseCase,
  UpdateDonationFromWebhookUseCase,
  GetAllDonationsUseCase,
  GetDonationStatisticsUseCase,
  GetMonthlyReportUseCase,
  GetYearlyReportUseCase,
} from "@/application/use-cases/DonationUseCases";
import {
  createDonationSchema,
  monthlySummaryQuerySchema,
  listDonationsQuerySchema,
  adminListDonationsQuerySchema,
  statisticsQuerySchema,
} from "@/presentation/dto/DonationRequestDTO";
import {
  toCreateDonationResponse,
  toDonationResponse,
  toDonationListResponse,
  toMonthlyDonationSummaryResponse,
  toDonationStatisticsResponse,
} from "@/presentation/dto/DonationResponseDTO";
import { createSnapTransaction } from "@/lib/midtrans";
import { AuthV2Utils } from "@/lib/authV2";
import prisma from "@/lib/prisma";
import { DonationStatus } from "@/domain/entities/Donation";

export class DonationController {
  constructor(
    private createDonationUseCase: CreateDonationUseCase,
    private getDonationDetailUseCase: GetDonationDetailUseCase,
    private getTenantDonationsUseCase: GetTenantDonationsUseCase,
    private getMonthlyDonationSummaryUseCase: GetMonthlyDonationSummaryUseCase,
    private updateDonationFromWebhookUseCase: UpdateDonationFromWebhookUseCase,
    private getAllDonationsUseCase: GetAllDonationsUseCase,
    private getDonationStatisticsUseCase: GetDonationStatisticsUseCase,
    private getMonthlyReportUseCase: GetMonthlyReportUseCase,
    private getYearlyReportUseCase: GetYearlyReportUseCase
  ) {}

  /**
   * Verify tenant access
   */
  private async verifyTenantAccess(
    request: Request,
    tenantId: string
  ): Promise<{ success: boolean; userId?: string; error?: NextResponse }> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: apiResponse.unauthorized("Unauthorized"),
      };
    }

    // Verify tenant ownership
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return {
        success: false,
        error: apiResponse.forbidden("Tenant not found or access denied"),
      };
    }

    return { success: true, userId: tenant.userId };
  }

  /**
   * Create Donation
   */
  async createDonation(request: Request, tenantId: string) {
    try {
      // Verify access
      const access = await this.verifyTenantAccess(request, tenantId);
      if (!access.success) return access.error;

      // Parse and validate body
      const body = await request.json();
      const validatedData = await createDonationSchema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Create donation (without snap token first)
      const result = await this.createDonationUseCase.execute({
        tenantId,
        paymentMethodId: validatedData.payment_method_id,
        amount: validatedData.amount,
        message: validatedData.message,
      });

      // Get tenant details for Midtrans
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return apiResponse.notFound("Tenant not found");
      }

      // Get payment method for enabled payments
      const paymentMethod = await prisma.donationPaymentMethod.findUnique({
        where: { id: validatedData.payment_method_id },
      });

      // Create Midtrans Snap transaction
      const snapToken = await createSnapTransaction({
        midtransOrderId: result.donation.midtransOrderId,
        amount: validatedData.amount,
        customer: {
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone || "",
        },
        items: [
          {
            id: "donation",
            price: validatedData.amount,
            quantity: 1,
            name: "Platform Donation",
          },
        ],
        enabledPayments: paymentMethod ? [paymentMethod.code] : undefined,
      });

      // Update donation with snap token
      await prisma.tenantDonation.update({
        where: { id: result.donation.id },
        data: { snapToken },
      });

      // Update the donation object
      result.donation = await this.getDonationDetailUseCase.execute(
        result.donation.id
      );

      return apiResponse.success({
        data: toCreateDonationResponse(result),
        message: "Donation created successfully"
      });
    } catch (error: any) {
      console.error("Create donation error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get Donation Detail
   */
  async getDonationDetail(request: Request, tenantId: string, donationId: string) {
    try {
      // Verify access
      const access = await this.verifyTenantAccess(request, tenantId);
      if (!access.success) return access.error;

      const donation = await this.getDonationDetailUseCase.execute(donationId);

      // Verify donation belongs to tenant
      if (donation.tenantId !== tenantId) {
        return apiResponse.notFound("Donation not found");
      }

      return apiResponse.success({
        data: toDonationResponse(donation),
        message: "Donation retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get donation detail error:", error);
      if (error.message === "Donation not found") {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get Tenant Donations (List)
   */
  async getTenantDonations(request: Request, tenantId: string) {
    try {
      // Verify access
      const access = await this.verifyTenantAccess(request, tenantId);
      if (!access.success) return access.error;

      // Parse query params
      const url = new URL(request.url);
      const queryParams = {
        page: parseInt(url.searchParams.get("page") || "1"),
        limit: parseInt(url.searchParams.get("limit") || "10"),
        status: url.searchParams.get("status") || undefined,
      };

      // Validate query params
      const validatedQuery = await listDonationsQuerySchema.validate(
        queryParams,
        { abortEarly: false }
      );

      const result = await this.getTenantDonationsUseCase.execute(
        tenantId,
        validatedQuery.page,
        validatedQuery.limit
      );

      const response = toDonationListResponse(
        result.donations,
        validatedQuery.page,
        validatedQuery.limit,
        result.total
      );

      return apiResponse.success({
        data: response.donations,
        message: "Donations retrieved successfully",
        pagination: {
          page: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        }
      });
    } catch (error: any) {
      console.error("Get tenant donations error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get Monthly Donation Summary
   */
  async getMonthlyDonationSummary(request: Request, tenantId: string) {
    try {
      // Verify access
      const access = await this.verifyTenantAccess(request, tenantId);
      if (!access.success) return access.error;

      // Parse query params
      const url = new URL(request.url);
      const queryParams = {
        year: parseInt(url.searchParams.get("year") || new Date().getFullYear().toString()),
        month: parseInt(url.searchParams.get("month") || (new Date().getMonth() + 1).toString()),
      };

      // Validate query params
      const validatedQuery = await monthlySummaryQuerySchema.validate(
        queryParams,
        { abortEarly: false }
      );

      const summary = await this.getMonthlyDonationSummaryUseCase.execute(
        tenantId,
        validatedQuery.year,
        validatedQuery.month
      );

      return apiResponse.success({
        data: toMonthlyDonationSummaryResponse(summary),
        message: "Monthly donation summary retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get monthly donation summary error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Handle Midtrans Webhook
   */
  async handleWebhook(notification: any) {
    try {
      console.log("Processing webhook for order:", notification.order_id);
      console.log("Transaction status:", notification.transaction_status);

      const result = await this.updateDonationFromWebhookUseCase.execute({
        midtransOrderId: notification.order_id,
        transactionStatus: notification.transaction_status,
        paymentType: notification.payment_type,
        transactionTime: notification.transaction_time,
        settlementTime: notification.settlement_time,
        fraudStatus: notification.fraud_status,
        fullResponse: notification,
      });

      console.log("Webhook processed successfully for donation:", result.id);

      return apiResponse.success({
        data: {
          donation_id: result.id,
          status: result.status,
        },
        message: "Webhook processed successfully"
      });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        notification: notification
      });
      return apiResponse.internalError();
    }
  }

  /**
   * Get All Donations (Admin)
   */
  async getAllDonations(request: Request) {
    try {
      // Parse query params
      const url = new URL(request.url);
      const queryParams = {
        page: parseInt(url.searchParams.get("page") || "1"),
        limit: parseInt(url.searchParams.get("limit") || "20"),
        tenant_id: url.searchParams.get("tenant_id") || undefined,
        status: url.searchParams.get("status") || undefined,
        payment_method_id: url.searchParams.get("payment_method_id") || undefined,
        start_date: url.searchParams.get("start_date") || undefined,
        end_date: url.searchParams.get("end_date") || undefined,
      };

      // Validate query params
      const validatedQuery = await adminListDonationsQuerySchema.validate(
        queryParams,
        { abortEarly: false }
      );

      const result = await this.getAllDonationsUseCase.execute(
        {
          tenantId: validatedQuery.tenant_id,
          status: validatedQuery.status as DonationStatus | undefined,
          paymentMethodId: validatedQuery.payment_method_id,
          startDate: validatedQuery.start_date ? new Date(validatedQuery.start_date) : undefined,
          endDate: validatedQuery.end_date ? new Date(validatedQuery.end_date) : undefined,
        },
        validatedQuery.page,
        validatedQuery.limit
      );

      const response = toDonationListResponse(
        result.donations,
        validatedQuery.page,
        validatedQuery.limit,
        result.total
      );

      return apiResponse.success({
        data: response.donations,
        message: "All donations retrieved successfully",
        pagination: {
          page: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        }
      });
    } catch (error: any) {
      console.error("Get all donations error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get Donation Statistics (Admin)
   */
  async getDonationStatistics(request: Request) {
    try {
      const url = new URL(request.url);
      const queryParams = {
        start_date: url.searchParams.get("start_date") || undefined,
        end_date: url.searchParams.get("end_date") || undefined,
      };

      const validatedQuery = await statisticsQuerySchema.validate(queryParams, {
        abortEarly: false,
      });

      const stats = await this.getDonationStatisticsUseCase.execute(
        validatedQuery.start_date ? new Date(validatedQuery.start_date) : undefined,
        validatedQuery.end_date ? new Date(validatedQuery.end_date) : undefined
      );

      return apiResponse.success({
        data: toDonationStatisticsResponse(stats),
        message: "Donation statistics retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get donation statistics error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get Monthly Report (Admin)
   */
  async getMonthlyReport(request: Request, year: number, month: number) {
    try {
      const report = await this.getMonthlyReportUseCase.execute(year, month);

      return apiResponse.success({
        data: {
          year,
          month,
          ...report,
        },
        message: "Monthly report retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get monthly report error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Get Yearly Report (Admin)
   */
  async getYearlyReport(request: Request, year: number) {
    try {
      const report = await this.getYearlyReportUseCase.execute(year);

      return apiResponse.success({
        data: {
          year,
          ...report,
        },
        message: "Yearly report retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get yearly report error:", error);
      return apiResponse.internalError();
    }
  }
}
