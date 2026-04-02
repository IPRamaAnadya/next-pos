/**
 * Domain Repository Interface: DonationRepository
 * Defines the contract for donation data access
 */

import {
  Donation,
  DonationStatus,
  MonthlyDonationSummary,
  DonationStatistics,
} from "../entities/Donation";

export interface CreateDonationParams {
  tenantId: string;
  paymentMethodId: string | null;
  midtransOrderId: string;
  snapToken: string | null;
  amount: number;
  transactionFee: number;
  netAmount: number;
  message?: string | null;
  expiryTime?: Date | null;
}

export interface UpdateDonationStatusParams {
  status: DonationStatus;
  paymentType?: string | null;
  transactionTime?: Date | null;
  settlementTime?: Date | null;
  midtransResponse?: Record<string, any> | null;
}

export interface DonationFilters {
  tenantId?: string;
  status?: DonationStatus;
  startDate?: Date;
  endDate?: Date;
  paymentMethodId?: string;
}

export interface DonationRepository {
  /**
   * Create a new donation
   */
  create(params: CreateDonationParams): Promise<Donation>;

  /**
   * Find donation by ID
   */
  findById(id: string): Promise<Donation | null>;

  /**
   * Find donation by Midtrans order ID
   */
  findByMidtransOrderId(orderId: string): Promise<Donation | null>;

  /**
   * Find donations by tenant ID with pagination
   */
  findByTenantId(
    tenantId: string,
    page: number,
    limit: number
  ): Promise<{ donations: Donation[]; total: number }>;

  /**
   * Find all donations with filters and pagination
   */
  findAll(
    filters: DonationFilters,
    page: number,
    limit: number
  ): Promise<{ donations: Donation[]; total: number }>;

  /**
   * Update donation status
   */
  updateStatus(
    id: string,
    params: UpdateDonationStatusParams
  ): Promise<Donation>;

  /**
   * Get monthly donation summary for a tenant
   */
  getMonthlyDonationSummary(
    tenantId: string,
    year: number,
    month: number
  ): Promise<MonthlyDonationSummary>;

  /**
   * Get donation statistics (admin)
   */
  getDonationStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<DonationStatistics>;

  /**
   * Get monthly report (admin)
   */
  getMonthlyReport(
    year: number,
    month: number
  ): Promise<{
    totalDonations: number;
    totalAmount: number;
    totalNetAmount: number;
    byTenant: Array<{
      tenantId: string;
      tenantName: string;
      donationCount: number;
      totalAmount: number;
    }>;
  }>;

  /**
   * Get yearly report (admin)
   */
  getYearlyReport(year: number): Promise<{
    totalDonations: number;
    totalAmount: number;
    totalNetAmount: number;
    byMonth: Array<{
      month: number;
      donationCount: number;
      totalAmount: number;
      totalNetAmount: number;
    }>;
  }>;

  /**
   * Mark expired donations
   */
  markExpiredDonations(): Promise<number>;
}
