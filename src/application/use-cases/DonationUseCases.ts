/**
 * Application Use Cases: Donation Operations
 * Contains business logic for donation operations
 */

import { DonationRepository } from "@/domain/repositories/DonationRepository";
import { PaymentMethodRepository } from "@/domain/repositories/PaymentMethodRepository";
import { Donation, DonationStatus } from "@/domain/entities/Donation";

/**
 * Create Donation Use Case
 */
export class CreateDonationUseCase {
  constructor(
    private donationRepository: DonationRepository,
    private paymentMethodRepository: PaymentMethodRepository
  ) {}

  async execute(params: {
    tenantId: string;
    paymentMethodId: string;
    amount: number;
    message?: string;
  }): Promise<{
    donation: Donation;
    recommendedAmount: number;
    warning?: string;
  }> {
    // Validate payment method
    const paymentMethod = await this.paymentMethodRepository.findById(
      params.paymentMethodId
    );

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (!paymentMethod.isAvailable()) {
      throw new Error("Payment method is not available");
    }

    // Validate amount
    if (!paymentMethod.isAmountValid(params.amount)) {
      throw new Error(
        `Amount must be between ${paymentMethod.minAmount} and ${
          paymentMethod.maxAmount || "unlimited"
        }`
      );
    }

    // Calculate fees
    const transactionFee = paymentMethod.calculateTotalFee(params.amount);
    const netAmount = params.amount - transactionFee;

    // Generate Midtrans order ID
    const midtransOrderId = `DON-${Date.now()}-${params.tenantId.substring(
      0,
      8
    )}`;

    // Set expiry time (24 hours for bank transfer, 1 hour for e-wallet)
    const expiryTime = new Date();
    if (paymentMethod.isBankTransfer()) {
      expiryTime.setHours(expiryTime.getHours() + 24);
    } else {
      expiryTime.setHours(expiryTime.getHours() + 1);
    }

    // Create donation
    const donation = await this.donationRepository.create({
      tenantId: params.tenantId,
      paymentMethodId: params.paymentMethodId,
      midtransOrderId,
      snapToken: null, // Will be set after Midtrans call
      amount: params.amount,
      transactionFee,
      netAmount,
      message: params.message,
      expiryTime,
    });

    // Check if amount is below recommended
    const recommendedAmount = paymentMethod.getRecommendedMinAmount();
    let warning: string | undefined;

    if (params.amount < recommendedAmount) {
      warning = `Your donation is below the recommended minimum of Rp ${recommendedAmount.toLocaleString()}. Consider donating more to maximize impact after transaction fees.`;
    }

    return {
      donation,
      recommendedAmount,
      warning,
    };
  }
}

/**
 * Get Donation Detail Use Case
 */
export class GetDonationDetailUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(donationId: string): Promise<Donation> {
    const donation = await this.donationRepository.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    return donation;
  }
}

/**
 * Get Tenant Donations Use Case
 */
export class GetTenantDonationsUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(
    tenantId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ donations: Donation[]; total: number; pages: number }> {
    const result = await this.donationRepository.findByTenantId(
      tenantId,
      page,
      limit
    );

    return {
      ...result,
      pages: Math.ceil(result.total / limit),
    };
  }
}

/**
 * Get Monthly Donation Summary Use Case
 */
export class GetMonthlyDonationSummaryUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(tenantId: string, year: number, month: number) {
    return await this.donationRepository.getMonthlyDonationSummary(
      tenantId,
      year,
      month
    );
  }
}

/**
 * Update Donation from Webhook Use Case
 */
export class UpdateDonationFromWebhookUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(params: {
    midtransOrderId: string;
    transactionStatus: string;
    paymentType?: string;
    transactionTime?: string;
    settlementTime?: string;
    fraudStatus?: string;
    fullResponse: Record<string, any>;
  }): Promise<Donation> {
    // Find donation by Midtrans order ID
    const donation = await this.donationRepository.findByMidtransOrderId(
      params.midtransOrderId
    );

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Map Midtrans status to our status
    let status: DonationStatus;

    switch (params.transactionStatus) {
      case "capture":
      case "settlement":
        // Check fraud status
        if (params.fraudStatus === "accept" || !params.fraudStatus) {
          status = DonationStatus.PAID;
        } else {
          status = DonationStatus.FAILED;
        }
        break;

      case "pending":
        status = DonationStatus.PENDING;
        break;

      case "deny":
      case "cancel":
      case "failure":
        status = DonationStatus.FAILED;
        break;

      case "expire":
        status = DonationStatus.EXPIRED;
        break;

      default:
        status = donation.status; // Keep current status
    }

    // Update donation
    const updatedDonation = await this.donationRepository.updateStatus(
      donation.id,
      {
        status,
        paymentType: params.paymentType || null,
        transactionTime: params.transactionTime
          ? new Date(params.transactionTime)
          : null,
        settlementTime: params.settlementTime
          ? new Date(params.settlementTime)
          : null,
        midtransResponse: params.fullResponse,
      }
    );

    return updatedDonation;
  }
}

/**
 * Get All Donations (Admin) Use Case
 */
export class GetAllDonationsUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(
    filters: {
      tenantId?: string;
      status?: DonationStatus;
      startDate?: Date;
      endDate?: Date;
      paymentMethodId?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ donations: Donation[]; total: number; pages: number }> {
    const result = await this.donationRepository.findAll(filters, page, limit);

    return {
      ...result,
      pages: Math.ceil(result.total / limit),
    };
  }
}

/**
 * Get Donation Statistics (Admin) Use Case
 */
export class GetDonationStatisticsUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(startDate?: Date, endDate?: Date) {
    return await this.donationRepository.getDonationStatistics(
      startDate,
      endDate
    );
  }
}

/**
 * Get Monthly Report (Admin) Use Case
 */
export class GetMonthlyReportUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(year: number, month: number) {
    return await this.donationRepository.getMonthlyReport(year, month);
  }
}

/**
 * Get Yearly Report (Admin) Use Case
 */
export class GetYearlyReportUseCase {
  constructor(private donationRepository: DonationRepository) {}

  async execute(year: number) {
    return await this.donationRepository.getYearlyReport(year);
  }
}
