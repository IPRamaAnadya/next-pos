/**
 * Presentation Layer: Donation Response DTOs
 * Transform domain entities to API responses
 */

import { Donation, DonationStatus, MonthlyDonationSummary, DonationStatistics } from "@/domain/entities/Donation";
import { PaymentMethod } from "@/domain/entities/PaymentMethod";

/**
 * Donation Response
 */
export interface DonationResponse {
  id: string;
  tenant_id: string;
  payment_method_id: string | null;
  midtrans_order_id: string;
  snap_token: string | null;
  amount: number;
  transaction_fee: number;
  net_amount: number;
  status: DonationStatus;
  payment_type: string | null;
  transaction_time: string | null;
  settlement_time: string | null;
  expiry_time: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export function toDonationResponse(donation: Donation): DonationResponse {
  return {
    id: donation.id,
    tenant_id: donation.tenantId,
    payment_method_id: donation.paymentMethodId,
    midtrans_order_id: donation.midtransOrderId,
    snap_token: donation.snapToken,
    amount: donation.amount,
    transaction_fee: donation.transactionFee,
    net_amount: donation.netAmount,
    status: donation.status,
    payment_type: donation.paymentType,
    transaction_time: donation.transactionTime ? donation.transactionTime.toISOString() : null,
    settlement_time: donation.settlementTime ? donation.settlementTime.toISOString() : null,
    expiry_time: donation.expiryTime ? donation.expiryTime.toISOString() : null,
    message: donation.message,
    created_at: donation.createdAt.toISOString(),
    updated_at: donation.updatedAt.toISOString(),
  };
}

/**
 * Donation List Response
 */
export interface DonationListResponse {
  donations: DonationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function toDonationListResponse(
  donations: Donation[],
  page: number,
  limit: number,
  total: number
): DonationListResponse {
  return {
    donations: donations.map(toDonationResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create Donation Response (with additional info)
 */
export interface CreateDonationResponse {
  donation: DonationResponse;
  snap_token: string;
  recommended_amount: number;
  warning?: string;
}

export function toCreateDonationResponse(params: {
  donation: Donation;
  recommendedAmount: number;
  warning?: string;
}): CreateDonationResponse {
  return {
    donation: toDonationResponse(params.donation),
    snap_token: params.donation.snapToken || "",
    recommended_amount: params.recommendedAmount,
    warning: params.warning,
  };
}

/**
 * Monthly Summary Response
 */
export interface MonthlyDonationSummaryResponse {
  tenant_id: string;
  year: number;
  month: number;
  total_donations: number;
  total_amount: number;
  total_net_amount: number;
  successful_donations: number;
  pending_donations: number;
  failed_donations: number;
}

export function toMonthlyDonationSummaryResponse(
  summary: MonthlyDonationSummary
): MonthlyDonationSummaryResponse {
  return {
    tenant_id: summary.tenantId,
    year: summary.year,
    month: summary.month,
    total_donations: summary.totalDonations,
    total_amount: summary.totalAmount,
    total_net_amount: summary.totalNetAmount,
    successful_donations: summary.successfulDonations,
    pending_donations: summary.pendingDonations,
    failed_donations: summary.failedDonations,
  };
}

/**
 * Statistics Response
 */
export interface DonationStatisticsResponse {
  total_donations: number;
  total_amount: number;
  total_net_amount: number;
  total_transaction_fees: number;
  by_status: {
    pending: number;
    paid: number;
    failed: number;
    expired: number;
  };
  by_payment_method: Array<{
    method_name: string;
    count: number;
    amount: number;
  }>;
}

export function toDonationStatisticsResponse(
  stats: DonationStatistics
): DonationStatisticsResponse {
  return {
    total_donations: stats.totalDonations,
    total_amount: stats.totalAmount,
    total_net_amount: stats.totalNetAmount,
    total_transaction_fees: stats.totalTransactionFees,
    by_status: stats.byStatus,
    by_payment_method: stats.byPaymentMethod.map((pm) => ({
      method_name: pm.methodName,
      count: pm.count,
      amount: pm.amount,
    })),
  };
}

/**
 * Monthly Report Response
 */
export interface MonthlyReportResponse {
  year: number;
  month: number;
  total_donations: number;
  total_amount: number;
  total_net_amount: number;
  by_tenant: Array<{
    tenant_id: string;
    tenant_name: string;
    donation_count: number;
    total_amount: number;
  }>;
}

/**
 * Yearly Report Response
 */
export interface YearlyReportResponse {
  year: number;
  total_donations: number;
  total_amount: number;
  total_net_amount: number;
  by_month: Array<{
    month: number;
    donation_count: number;
    total_amount: number;
    total_net_amount: number;
  }>;
}

/**
 * Payment Method Response
 */
export interface PaymentMethodResponse {
  id: string;
  name: string;
  code: string;
  type: string;
  transaction_fee: number;
  fee_percentage: number | null;
  tax_percentage: number | null;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
  icon_url: string | null;
  description: string | null;
  display_order: number;
  recommended_min_amount: number;
  created_at: string;
  updated_at: string;
}

export function toPaymentMethodResponse(
  paymentMethod: PaymentMethod
): PaymentMethodResponse {
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    code: paymentMethod.code,
    type: paymentMethod.type,
    transaction_fee: paymentMethod.transactionFee,
    fee_percentage: paymentMethod.feePercentage,
    tax_percentage: paymentMethod.taxPercentage,
    min_amount: paymentMethod.minAmount,
    max_amount: paymentMethod.maxAmount,
    is_active: paymentMethod.isActive,
    icon_url: paymentMethod.iconUrl,
    description: paymentMethod.description,
    display_order: paymentMethod.displayOrder,
    recommended_min_amount: paymentMethod.getRecommendedMinAmount(),
    created_at: paymentMethod.createdAt.toISOString(),
    updated_at: paymentMethod.updatedAt.toISOString(),
  };
}

/**
 * Payment Method List Response
 */
export interface PaymentMethodListResponse {
  payment_methods: PaymentMethodResponse[];
}

export function toPaymentMethodListResponse(
  paymentMethods: PaymentMethod[]
): PaymentMethodListResponse {
  return {
    payment_methods: paymentMethods.map(toPaymentMethodResponse),
  };
}
