/**
 * Repository interfaces for Hunter/Affiliate System
 */

import type {
  Hunter,
  HunterCommission,
  HunterPayout,
  SystemLedger,
  CreateHunterDTO,
  UpdateHunterDTO,
  CreateCommissionDTO,
  UpdateCommissionStatusDTO,
  CreatePayoutDTO,
  UpdatePayoutStatusDTO,
  CreateLedgerEntryDTO,
  HunterStatistics,
  CommissionSummary,
  LedgerSummary,
  HunterEarningsReport,
  CommissionStatus,
  PayoutStatus,
  LedgerCategory,
} from '../entities/Hunter';

/**
 * Repository interface for Hunter operations
 */
export interface HunterRepository {
  /**
   * Create a new hunter
   */
  create(dto: CreateHunterDTO): Promise<Hunter>;

  /**
   * Update hunter information
   */
  update(id: string, dto: UpdateHunterDTO): Promise<Hunter>;

  /**
   * Find hunter by ID
   */
  findById(id: string): Promise<Hunter | null>;

  /**
   * Find hunter by referral code
   */
  findByReferralCode(referralCode: string): Promise<Hunter | null>;

  /**
   * Find hunter by email
   */
  findByEmail(email: string): Promise<Hunter | null>;

  /**
   * Find hunter by user ID
   */
  findByUserId(userId: string): Promise<Hunter | null>;

  /**
   * Get all hunters (with pagination and filters)
   */
  findAll(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    adminId?: string;
    searchQuery?: string;
  }): Promise<{
    hunters: Hunter[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Get hunter statistics
   */
  getStatistics(hunterId: string, dateFrom?: Date, dateTo?: Date): Promise<HunterStatistics>;

  /**
   * Delete hunter (soft delete by setting isActive=false)
   */
  deactivate(id: string): Promise<void>;

  /**
   * Generate unique referral code
   */
  generateReferralCode(): Promise<string>;

  /**
   * Update total earnings
   */
  updateEarnings(hunterId: string, earningsChange: number): Promise<void>;

  /**
   * Update total paid out
   */
  updatePaidOut(hunterId: string, paidOutChange: number): Promise<void>;
}

/**
 * Repository interface for Hunter Commission operations
 */
export interface HunterCommissionRepository {
  /**
   * Create a new commission record
   */
  create(dto: CreateCommissionDTO): Promise<HunterCommission>;

  /**
   * Update commission status
   */
  updateStatus(dto: UpdateCommissionStatusDTO): Promise<HunterCommission>;

  /**
   * Find commission by ID
   */
  findById(id: string): Promise<HunterCommission | null>;

  /**
   * Find commission by donation ID
   */
  findByDonationId(donationId: string): Promise<HunterCommission | null>;

  /**
   * Get all commissions for a hunter
   */
  findByHunterId(
    hunterId: string,
    params?: {
      status?: CommissionStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterCommission[]>;

  /**
   * Get all commissions for a tenant
   */
  findByTenantId(
    tenantId: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterCommission[]>;

  /**
   * Get commission summary for a hunter
   */
  getSummary(hunterId: string, dateFrom?: Date, dateTo?: Date): Promise<CommissionSummary>;

  /**
   * Get pending commissions ready for payout
   */
  findPendingForPayout(hunterId: string): Promise<HunterCommission[]>;

  /**
   * Mark multiple commissions as paid
   */
  markAsPaid(commissionIds: string[], paidOutAt: Date): Promise<void>;

  /**
   * Calculate total commissions for a hunter
   */
  calculateTotal(hunterId: string, status?: CommissionStatus): Promise<number>;
}

/**
 * Repository interface for Hunter Payout operations
 */
export interface HunterPayoutRepository {
  /**
   * Create a new payout record
   */
  create(dto: CreatePayoutDTO): Promise<HunterPayout>;

  /**
   * Update payout status
   */
  updateStatus(dto: UpdatePayoutStatusDTO): Promise<HunterPayout>;

  /**
   * Find payout by ID
   */
  findById(id: string): Promise<HunterPayout | null>;

  /**
   * Get all payouts for a hunter
   */
  findByHunterId(
    hunterId: string,
    params?: {
      status?: PayoutStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterPayout[]>;

  /**
   * Get all pending payouts
   */
  findPendingPayouts(limit?: number): Promise<HunterPayout[]>;

  /**
   * Calculate total payouts for a hunter
   */
  calculateTotal(hunterId: string, status?: PayoutStatus): Promise<number>;
}

/**
 * Repository interface for System Ledger operations
 */
export interface SystemLedgerRepository {
  /**
   * Create a new ledger entry
   */
  create(dto: CreateLedgerEntryDTO): Promise<SystemLedger>;

  /**
   * Get ledger entries with filters
   */
  findAll(params: {
    dateFrom?: Date;
    dateTo?: Date;
    category?: LedgerCategory;
    hunterId?: string;
    tenantId?: string;
    referenceType?: string;
    referenceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SystemLedger[]>;

  /**
   * Get ledger summary
   */
  getSummary(dateFrom?: Date, dateTo?: Date): Promise<LedgerSummary>;

  /**
   * Get current system balance
   */
  getCurrentBalance(): Promise<number>;

  /**
   * Get ledger entries for a specific hunter
   */
  findByHunterId(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]>;

  /**
   * Get ledger entries for a specific tenant
   */
  findByTenantId(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]>;
}
