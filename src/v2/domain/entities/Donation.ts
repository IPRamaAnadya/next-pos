/**
 * Domain Entity: Donation
 * Represents a donation transaction from a tenant
 */

export enum DonationStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export class Donation {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly paymentMethodId: string | null,
    public readonly midtransOrderId: string,
    public readonly snapToken: string | null,
    public readonly amount: number,
    public readonly transactionFee: number,
    public readonly netAmount: number,
    public readonly status: DonationStatus,
    public readonly paymentType: string | null,
    public readonly transactionTime: Date | null,
    public readonly settlementTime: Date | null,
    public readonly expiryTime: Date | null,
    public readonly message: string | null,
    public readonly midtransResponse: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if donation is pending
   */
  isPending(): boolean {
    return this.status === DonationStatus.PENDING;
  }

  /**
   * Check if donation is paid/successful
   */
  isPaid(): boolean {
    return this.status === DonationStatus.PAID;
  }

  /**
   * Check if donation has failed
   */
  isFailed(): boolean {
    return this.status === DonationStatus.FAILED;
  }

  /**
   * Check if donation has expired
   */
  isExpired(): boolean {
    return this.status === DonationStatus.EXPIRED;
  }

  /**
   * Check if donation can be cancelled (only pending donations)
   */
  canBeCancelled(): boolean {
    return this.isPending() && !this.isExpiredByTime();
  }

  /**
   * Check if donation has expired by time
   */
  isExpiredByTime(): boolean {
    if (!this.expiryTime) return false;
    return new Date() > this.expiryTime;
  }

  /**
   * Get donation age in hours
   */
  getAgeInHours(): number {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Calculate platform's net income (amount - transaction fee)
   */
  getPlatformIncome(): number {
    return this.isPaid() ? this.netAmount : 0;
  }
}

/**
 * Monthly donation summary for a tenant
 */
export interface MonthlyDonationSummary {
  tenantId: string;
  year: number;
  month: number;
  totalDonations: number;
  totalAmount: number;
  totalNetAmount: number;
  successfulDonations: number;
  pendingDonations: number;
  failedDonations: number;
}

/**
 * Donation statistics
 */
export interface DonationStatistics {
  totalDonations: number;
  totalAmount: number;
  totalNetAmount: number;
  totalTransactionFees: number;
  byStatus: {
    pending: number;
    paid: number;
    failed: number;
    expired: number;
  };
  byPaymentMethod: Array<{
    methodName: string;
    count: number;
    amount: number;
  }>;
}
