/**
 * Domain Entity: Hunter/Affiliate System
 * Entities for hunter management, commission tracking, and system ledger
 */

export interface Hunter {
  id: string;
  userId?: string | null;
  adminId: string;
  referralCode: string;
  name: string;
  email: string;
  phone?: string | null;
  commissionPercentage: number;
  isActive: boolean;
  totalEarnings: number;
  totalPaidOut: number;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HunterCommission {
  id: string;
  hunterId: string;
  tenantId: string;
  donationId: string;
  donationAmount: number; // Net amount after transaction fees
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidOutAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HunterPayout {
  id: string;
  hunterId: string;
  amount: number;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  status: PayoutStatus;
  processedBy?: string | null;
  processedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemLedger {
  id: string;
  transactionType: TransactionType;
  category: LedgerCategory;
  amount: number;
  balance: number;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  hunterId?: string | null;
  tenantId?: string | null;
  donationId?: string | null;
  commissionId?: string | null;
  payoutId?: string | null;
  metadata?: any;
  createdAt: Date;
}

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TransactionType = 'DEBIT' | 'CREDIT';
export type LedgerCategory = 
  | 'DONATION_RECEIVED'
  | 'DONATION_REFUND'
  | 'COMMISSION_CALCULATED'
  | 'COMMISSION_PAID'
  | 'SUBSCRIPTION_RECEIVED'
  | 'PLATFORM_FEE'
  | 'PAYMENT_GATEWAY_FEE'
  | 'PAYOUT_TO_HUNTER'
  | 'OTHER_INCOME'
  | 'OTHER_EXPENSE';

// DTOs for creating/updating

export interface CreateHunterDTO {
  userId?: string;
  adminId: string;
  name: string;
  email: string;
  phone?: string;
  commissionPercentage: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  notes?: string;
}

export interface UpdateHunterDTO {
  name?: string;
  email?: string;
  phone?: string;
  commissionPercentage?: number;
  isActive?: boolean;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  notes?: string;
}

export interface CreateCommissionDTO {
  hunterId: string;
  tenantId: string;
  donationId: string;
  donationAmount: number;
  commissionRate: number;
}

export interface UpdateCommissionStatusDTO {
  commissionId: string;
  status: CommissionStatus;
  notes?: string;
}

export interface CreatePayoutDTO {
  hunterId: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  processedBy: string;
  notes?: string;
}

export interface UpdatePayoutStatusDTO {
  payoutId: string;
  status: PayoutStatus;
  processedBy?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface CreateLedgerEntryDTO {
  transactionType: TransactionType;
  category: LedgerCategory;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  hunterId?: string;
  tenantId?: string;
  donationId?: string;
  commissionId?: string;
  payoutId?: string;
  metadata?: any;
}

// Statistics and Reports

export interface HunterStatistics {
  hunterId: string;
  hunterName: string;
  totalReferrals: number; // Number of tenants referred
  totalDonations: number; // Total donations from referred tenants
  totalCommissionsEarned: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  availableBalance: number; // Earned but not yet paid out
}

export interface CommissionSummary {
  totalCommissions: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  cancelledAmount: number;
  count: {
    pending: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
}

export interface LedgerSummary {
  totalCredits: number; // Money in
  totalDebits: number; // Money out
  netBalance: number; // Credits - Debits
  currentBalance: number; // Latest balance in ledger
  byCategory: {
    category: LedgerCategory;
    amount: number;
    count: number;
  }[];
}

export interface HunterEarningsReport {
  hunterId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalDonations: number;
  totalCommissionsEarned: number;
  totalCommissionsPaid: number;
  commissionsBreakdown: {
    pending: number;
    approved: number;
    paid: number;
  };
  topReferrals: {
    tenantId: string;
    tenantName: string;
    totalDonations: number;
    commissionsEarned: number;
  }[];
}
