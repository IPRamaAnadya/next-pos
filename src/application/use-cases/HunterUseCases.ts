/**
 * Use Cases for Hunter/Affiliate System
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
  LedgerCategory,
  CommissionStatus,
  PayoutStatus,
} from '@/domain/entities/Hunter';
import type {
  HunterRepository,
  HunterCommissionRepository,
  HunterPayoutRepository,
  SystemLedgerRepository,
} from '@/domain/repositories/HunterRepository';

// ===========================
// HUNTER MANAGEMENT USE CASES
// ===========================

export class CreateHunterUseCase {
  constructor(
    private hunterRepository: HunterRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(dto: CreateHunterDTO): Promise<Hunter> {
    // Check if email already exists
    const existing = await this.hunterRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('Hunter with this email already exists');
    }

    // If userId provided, check if user already a hunter
    if (dto.userId) {
      const existingUser = await this.hunterRepository.findByUserId(dto.userId);
      if (existingUser) {
        throw new Error('This user is already registered as a hunter');
      }
    }

    const hunter = await this.hunterRepository.create(dto);

    // Log to system ledger
    await this.ledgerRepository.create({
      transactionType: 'CREDIT',
      category: 'OTHER_INCOME',
      amount: 0,
      description: `Hunter created: ${hunter.name} (${hunter.referralCode})`,
      referenceType: 'hunter_created',
      referenceId: hunter.id,
      hunterId: hunter.id,
    });

    return hunter;
  }
}

export class UpdateHunterUseCase {
  constructor(private hunterRepository: HunterRepository) {}

  async execute(id: string, dto: UpdateHunterDTO): Promise<Hunter> {
    const hunter = await this.hunterRepository.findById(id);
    if (!hunter) {
      throw new Error('Hunter not found');
    }

    // If email is being changed, check uniqueness
    if (dto.email && dto.email !== hunter.email) {
      const existing = await this.hunterRepository.findByEmail(dto.email);
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    return await this.hunterRepository.update(id, dto);
  }
}

export class GetHunterUseCase {
  constructor(private hunterRepository: HunterRepository) {}

  async execute(id: string): Promise<Hunter> {
    const hunter = await this.hunterRepository.findById(id);
    if (!hunter) {
      throw new Error('Hunter not found');
    }
    return hunter;
  }
}

export class GetHunterByReferralCodeUseCase {
  constructor(private hunterRepository: HunterRepository) {}

  async execute(referralCode: string): Promise<Hunter | null> {
    return await this.hunterRepository.findByReferralCode(referralCode);
  }
}

export class ListHuntersUseCase {
  constructor(private hunterRepository: HunterRepository) {}

  async execute(params: {
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
  }> {
    return await this.hunterRepository.findAll(params);
  }
}

export class GetHunterStatisticsUseCase {
  constructor(private hunterRepository: HunterRepository) {}

  async execute(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<HunterStatistics> {
    return await this.hunterRepository.getStatistics(hunterId, dateFrom, dateTo);
  }
}

export class DeactivateHunterUseCase {
  constructor(
    private hunterRepository: HunterRepository,
    private commissionRepository: HunterCommissionRepository
  ) {}

  async execute(id: string): Promise<void> {
    const hunter = await this.hunterRepository.findById(id);
    if (!hunter) {
      throw new Error('Hunter not found');
    }

    // Check for pending commissions
    const pendingCommissions = await this.commissionRepository.findPendingForPayout(id);
    if (pendingCommissions.length > 0) {
      throw new Error('Cannot deactivate hunter with pending commissions. Please process payouts first.');
    }

    await this.hunterRepository.deactivate(id);
  }
}

// ===========================
// COMMISSION MANAGEMENT USE CASES
// ===========================

export class CalculateCommissionUseCase {
  constructor(
    private commissionRepository: HunterCommissionRepository,
    private hunterRepository: HunterRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(dto: CreateCommissionDTO): Promise<HunterCommission> {
    // Check if commission already exists for this donation
    const existing = await this.commissionRepository.findByDonationId(dto.donationId);
    if (existing) {
      throw new Error('Commission already calculated for this donation');
    }

    // Verify hunter exists and is active
    const hunter = await this.hunterRepository.findById(dto.hunterId);
    if (!hunter) {
      throw new Error('Hunter not found');
    }
    if (!hunter.isActive) {
      throw new Error('Hunter is not active');
    }

    // Create commission (donationAmount should already be netAmount from caller)
    const commission = await this.commissionRepository.create(dto);

    // Update hunter's total earnings
    await this.hunterRepository.updateEarnings(dto.hunterId, commission.commissionAmount);

    // Log to system ledger
    await this.ledgerRepository.create({
      transactionType: 'DEBIT',
      category: 'COMMISSION_CALCULATED',
      amount: commission.commissionAmount,
      description: `Commission calculated for hunter ${hunter.name} (${hunter.referralCode}) - ${commission.commissionRate}% of net amount ${commission.donationAmount}`,
      referenceType: 'commission',
      referenceId: commission.id,
      hunterId: dto.hunterId,
      tenantId: dto.tenantId,
      donationId: dto.donationId,
      commissionId: commission.id,
    });

    return commission;
  }
}

export class ApproveCommissionUseCase {
  constructor(private commissionRepository: HunterCommissionRepository) {}

  async execute(commissionId: string, notes?: string): Promise<HunterCommission> {
    const commission = await this.commissionRepository.findById(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status !== 'PENDING') {
      throw new Error('Only pending commissions can be approved');
    }

    return await this.commissionRepository.updateStatus({
      commissionId,
      status: 'APPROVED',
      notes,
    });
  }
}

export class CancelCommissionUseCase {
  constructor(
    private commissionRepository: HunterCommissionRepository,
    private hunterRepository: HunterRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(commissionId: string, notes?: string): Promise<HunterCommission> {
    const commission = await this.commissionRepository.findById(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status === 'PAID') {
      throw new Error('Cannot cancel paid commission');
    }

    // Update commission status
    const updated = await this.commissionRepository.updateStatus({
      commissionId,
      status: 'CANCELLED',
      notes,
    });

    // Reverse the earnings
    await this.hunterRepository.updateEarnings(commission.hunterId, -commission.commissionAmount);

    // Log reversal to ledger
    await this.ledgerRepository.create({
      transactionType: 'CREDIT',
      category: 'COMMISSION_CALCULATED',
      amount: commission.commissionAmount,
      description: `Commission cancelled - ${notes || 'No reason provided'}`,
      referenceType: 'commission_cancelled',
      referenceId: commissionId,
      hunterId: commission.hunterId,
      tenantId: commission.tenantId,
      donationId: commission.donationId,
      commissionId: commission.id,
    });

    return updated;
  }
}

export class GetCommissionsByHunterUseCase {
  constructor(private commissionRepository: HunterCommissionRepository) {}

  async execute(
    hunterId: string,
    params?: {
      status?: CommissionStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterCommission[]> {
    return await this.commissionRepository.findByHunterId(hunterId, params);
  }
}

export class GetCommissionSummaryUseCase {
  constructor(private commissionRepository: HunterCommissionRepository) {}

  async execute(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CommissionSummary> {
    return await this.commissionRepository.getSummary(hunterId, dateFrom, dateTo);
  }
}

// ===========================
// PAYOUT MANAGEMENT USE CASES
// ===========================

export class CreatePayoutUseCase {
  constructor(
    private payoutRepository: HunterPayoutRepository,
    private commissionRepository: HunterCommissionRepository,
    private hunterRepository: HunterRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(dto: CreatePayoutDTO): Promise<HunterPayout> {
    // Verify hunter exists
    const hunter = await this.hunterRepository.findById(dto.hunterId);
    if (!hunter) {
      throw new Error('Hunter not found');
    }

    // Get pending commissions
    const pendingCommissions = await this.commissionRepository.findPendingForPayout(dto.hunterId);
    const totalAvailable = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    if (dto.amount > totalAvailable) {
      throw new Error(`Payout amount exceeds available balance. Available: ${totalAvailable}`);
    }

    // Create payout record
    const payout = await this.payoutRepository.create(dto);

    // Log to ledger
    await this.ledgerRepository.create({
      transactionType: 'DEBIT',
      category: 'PAYOUT_TO_HUNTER',
      amount: dto.amount,
      description: `Payout initiated for hunter ${hunter.name} (${hunter.referralCode}) - ${dto.paymentMethod || 'Not specified'}`,
      referenceType: 'payout',
      referenceId: payout.id,
      hunterId: dto.hunterId,
      payoutId: payout.id,
      metadata: {
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
      },
    });

    return payout;
  }
}

export class ProcessPayoutUseCase {
  constructor(
    private payoutRepository: HunterPayoutRepository,
    private commissionRepository: HunterCommissionRepository,
    private hunterRepository: HunterRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(dto: UpdatePayoutStatusDTO): Promise<HunterPayout> {
    const payout = await this.payoutRepository.findById(dto.payoutId);
    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
      throw new Error('Only pending or processing payouts can be updated');
    }

    // Update payout status
    const updated = await this.payoutRepository.updateStatus(dto);

    // If completed, update commissions and hunter's paid out amount
    if (dto.status === 'COMPLETED') {
      // Update hunter's total paid out
      await this.hunterRepository.updatePaidOut(payout.hunterId, payout.amount);

      // Mark commissions as paid (up to the payout amount)
      const pendingCommissions = await this.commissionRepository.findPendingForPayout(payout.hunterId);
      let remainingAmount = payout.amount;
      const commissionsToPay: string[] = [];

      for (const commission of pendingCommissions) {
        if (remainingAmount <= 0) break;
        
        if (commission.commissionAmount <= remainingAmount) {
          commissionsToPay.push(commission.id);
          remainingAmount -= commission.commissionAmount;
        }
      }

      if (commissionsToPay.length > 0) {
        await this.commissionRepository.markAsPaid(commissionsToPay, new Date());
      }

      // Log completion to ledger
      await this.ledgerRepository.create({
        transactionType: 'DEBIT',
        category: 'COMMISSION_PAID',
        amount: payout.amount,
        description: `Payout completed - ${dto.referenceNumber || 'No reference'}`,
        referenceType: 'payout_completed',
        referenceId: payout.id,
        hunterId: payout.hunterId,
        payoutId: payout.id,
        metadata: {
          commissionsPaid: commissionsToPay.length,
          referenceNumber: dto.referenceNumber,
        },
      });
    }

    return updated;
  }
}

export class GetPayoutsByHunterUseCase {
  constructor(private payoutRepository: HunterPayoutRepository) {}

  async execute(
    hunterId: string,
    params?: {
      status?: PayoutStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterPayout[]> {
    return await this.payoutRepository.findByHunterId(hunterId, params);
  }
}

export class GetPendingPayoutsUseCase {
  constructor(private payoutRepository: HunterPayoutRepository) {}

  async execute(limit?: number): Promise<HunterPayout[]> {
    return await this.payoutRepository.findPendingPayouts(limit);
  }
}

// ===========================
// LEDGER MANAGEMENT USE CASES
// ===========================

export class RecordLedgerEntryUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(dto: CreateLedgerEntryDTO): Promise<SystemLedger> {
    return await this.ledgerRepository.create(dto);
  }
}

export class GetLedgerEntriesUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(params: {
    dateFrom?: Date;
    dateTo?: Date;
    category?: LedgerCategory;
    hunterId?: string;
    tenantId?: string;
    referenceType?: string;
    referenceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SystemLedger[]> {
    return await this.ledgerRepository.findAll(params);
  }
}

export class GetLedgerSummaryUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(dateFrom?: Date, dateTo?: Date): Promise<LedgerSummary> {
    return await this.ledgerRepository.getSummary(dateFrom, dateTo);
  }
}

export class GetSystemBalanceUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(): Promise<number> {
    return await this.ledgerRepository.getCurrentBalance();
  }
}

export class GetHunterLedgerUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]> {
    return await this.ledgerRepository.findByHunterId(hunterId, dateFrom, dateTo, limit);
  }
}

export class GetTenantLedgerUseCase {
  constructor(private ledgerRepository: SystemLedgerRepository) {}

  async execute(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]> {
    return await this.ledgerRepository.findByTenantId(tenantId, dateFrom, dateTo, limit);
  }
}

// ===========================
// WEBHOOK/EVENT HANDLER USE CASE
// ===========================

export class HandleDonationSettlementUseCase {
  constructor(
    private hunterRepository: HunterRepository,
    private commissionRepository: HunterCommissionRepository,
    private ledgerRepository: SystemLedgerRepository
  ) {}

  async execute(donationId: string, donation: {
    tenantId: string;
    amount: number;
    netAmount: number; // Amount after transaction fees
    transactionFee: number;
    hunterReferralCode?: string;
  }): Promise<HunterCommission | null> {
    // Record donation received in ledger (gross amount)
    await this.ledgerRepository.create({
      transactionType: 'CREDIT',
      category: 'DONATION_RECEIVED',
      amount: donation.amount,
      description: `Donation received from tenant (gross amount before fees)`,
      referenceType: 'donation',
      referenceId: donationId,
      tenantId: donation.tenantId,
      donationId: donationId,
      metadata: {
        grossAmount: donation.amount,
        netAmount: donation.netAmount,
        transactionFee: donation.transactionFee,
      },
    });

    // Record transaction fee as expense
    if (donation.transactionFee > 0) {
      await this.ledgerRepository.create({
        transactionType: 'DEBIT',
        category: 'PAYMENT_GATEWAY_FEE',
        amount: donation.transactionFee,
        description: `Payment gateway transaction fee for donation`,
        referenceType: 'donation_fee',
        referenceId: donationId,
        tenantId: donation.tenantId,
        donationId: donationId,
        metadata: {
          grossAmount: donation.amount,
          feeAmount: donation.transactionFee,
        },
      });
    }

    // Check if tenant has hunter referral code
    if (!donation.hunterReferralCode) {
      return null;
    }

    // Find hunter by referral code
    const hunter = await this.hunterRepository.findByReferralCode(donation.hunterReferralCode);
    if (!hunter || !hunter.isActive) {
      console.warn(`Hunter not found or inactive for referral code: ${donation.hunterReferralCode}`);
      return null;
    }

    // Check if commission already exists
    const existing = await this.commissionRepository.findByDonationId(donationId);
    if (existing) {
      return existing;
    }

    // Calculate and create commission using NET AMOUNT (after transaction fees)
    const calculateUseCase = new CalculateCommissionUseCase(
      this.commissionRepository,
      this.hunterRepository,
      this.ledgerRepository
    );

    const commission = await calculateUseCase.execute({
      hunterId: hunter.id,
      tenantId: donation.tenantId,
      donationId,
      donationAmount: donation.netAmount, // Use netAmount instead of gross amount
      commissionRate: hunter.commissionPercentage,
    });

    return commission;
  }
}
