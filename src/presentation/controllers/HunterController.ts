/**
 * Controller for Hunter/Affiliate System
 */

import { NextRequest } from 'next/server';
import { apiResponse } from '@/app/api/utils/response';
import {
  PrismaHunterRepository,
  PrismaHunterCommissionRepository,
  PrismaHunterPayoutRepository,
  PrismaSystemLedgerRepository,
} from '@/infrastructure/repositories/PrismaHunterRepository';
import * as HunterUseCases from '@/application/use-cases/HunterUseCases';
import type {
  CreateHunterDTO,
  UpdateHunterDTO,
  CreateCommissionDTO,
  CreatePayoutDTO,
  UpdatePayoutStatusDTO,
  CreateLedgerEntryDTO,
  LedgerCategory,
} from '@/domain/entities/Hunter';

export class HunterController {
  private hunterRepo: PrismaHunterRepository;
  private commissionRepo: PrismaHunterCommissionRepository;
  private payoutRepo: PrismaHunterPayoutRepository;
  private ledgerRepo: PrismaSystemLedgerRepository;

  constructor() {
    this.hunterRepo = new PrismaHunterRepository();
    this.commissionRepo = new PrismaHunterCommissionRepository();
    this.payoutRepo = new PrismaHunterPayoutRepository();
    this.ledgerRepo = new PrismaSystemLedgerRepository();
  }

  // ===========================
  // HUNTER MANAGEMENT
  // ===========================

  async createHunter(dto: CreateHunterDTO) {
    try {
      const useCase = new HunterUseCases.CreateHunterUseCase(this.hunterRepo, this.ledgerRepo);
      const hunter = await useCase.execute(dto);

      return apiResponse.success({
        data: hunter,
        message: 'Hunter created successfully',
      });
    } catch (error: any) {
      console.error('Create hunter error:', error);
      return apiResponse.internalError();
    }
  }

  async updateHunter(id: string, dto: UpdateHunterDTO) {
    try {
      const useCase = new HunterUseCases.UpdateHunterUseCase(this.hunterRepo);
      const hunter = await useCase.execute(id, dto);

      return apiResponse.success({
        data: hunter,
        message: 'Hunter updated successfully',
      });
    } catch (error: any) {
      console.error('Update hunter error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  async getHunter(id: string) {
    try {
      const useCase = new HunterUseCases.GetHunterUseCase(this.hunterRepo);
      const hunter = await useCase.execute(id);

      return apiResponse.success({
        data: hunter,
        message: 'Hunter retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get hunter error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  async getHunterByReferralCode(referralCode: string) {
    try {
      const useCase = new HunterUseCases.GetHunterByReferralCodeUseCase(this.hunterRepo);
      const hunter = await useCase.execute(referralCode);

      if (!hunter) {
        return apiResponse.notFound('Hunter not found');
      }

      return apiResponse.success({
        data: hunter,
        message: 'Hunter retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get hunter by referral code error:', error);
      return apiResponse.internalError();
    }
  }

  async listHunters(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    adminId?: string;
    searchQuery?: string;
  }) {
    try {
      const useCase = new HunterUseCases.ListHuntersUseCase(this.hunterRepo);
      const result = await useCase.execute(params);

      return apiResponse.success({
        data: result.hunters,
        message: 'Hunters retrieved successfully',
        pagination: {
          page: result.page,
          pageSize: result.limit,
          total: result.total,
        },
      });
    } catch (error: any) {
      console.error('List hunters error:', error);
      return apiResponse.internalError();
    }
  }

  async getHunterStatistics(hunterId: string, dateFrom?: Date, dateTo?: Date) {
    try {
      const useCase = new HunterUseCases.GetHunterStatisticsUseCase(this.hunterRepo);
      const stats = await useCase.execute(hunterId, dateFrom, dateTo);

      return apiResponse.success({
        data: stats,
        message: 'Hunter statistics retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get hunter statistics error:', error);
      return apiResponse.internalError();
    }
  }

  async deactivateHunter(id: string) {
    try {
      const useCase = new HunterUseCases.DeactivateHunterUseCase(this.hunterRepo, this.commissionRepo);
      await useCase.execute(id);

      return apiResponse.success({
        data: null,
        message: 'Hunter deactivated successfully',
      });
    } catch (error: any) {
      console.error('Deactivate hunter error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.forbidden(error.message);
    }
  }

  // ===========================
  // COMMISSION MANAGEMENT
  // ===========================

  async calculateCommission(dto: CreateCommissionDTO) {
    try {
      const useCase = new HunterUseCases.CalculateCommissionUseCase(
        this.commissionRepo,
        this.hunterRepo,
        this.ledgerRepo
      );
      const commission = await useCase.execute(dto);

      return apiResponse.success({
        data: commission,
        message: 'Commission calculated successfully',
      });
    } catch (error: any) {
      console.error('Calculate commission error:', error);
      return apiResponse.forbidden(error.message);
    }
  }

  async approveCommission(commissionId: string, notes?: string) {
    try {
      const useCase = new HunterUseCases.ApproveCommissionUseCase(this.commissionRepo);
      const commission = await useCase.execute(commissionId, notes);

      return apiResponse.success({
        data: commission,
        message: 'Commission approved successfully',
      });
    } catch (error: any) {
      console.error('Approve commission error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.forbidden(error.message);
    }
  }

  async cancelCommission(commissionId: string, notes?: string) {
    try {
      const useCase = new HunterUseCases.CancelCommissionUseCase(
        this.commissionRepo,
        this.hunterRepo,
        this.ledgerRepo
      );
      const commission = await useCase.execute(commissionId, notes);

      return apiResponse.success({
        data: commission,
        message: 'Commission cancelled successfully',
      });
    } catch (error: any) {
      console.error('Cancel commission error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.forbidden(error.message);
    }
  }

  async getCommissionsByHunter(
    hunterId: string,
    params?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const useCase = new HunterUseCases.GetCommissionsByHunterUseCase(this.commissionRepo);
      const commissions = await useCase.execute(hunterId, params as any);

      return apiResponse.success({
        data: commissions,
        message: 'Commissions retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get commissions error:', error);
      return apiResponse.internalError();
    }
  }

  async getCommissionSummary(hunterId: string, dateFrom?: Date, dateTo?: Date) {
    try {
      const useCase = new HunterUseCases.GetCommissionSummaryUseCase(this.commissionRepo);
      const summary = await useCase.execute(hunterId, dateFrom, dateTo);

      return apiResponse.success({
        data: summary,
        message: 'Commission summary retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get commission summary error:', error);
      return apiResponse.internalError();
    }
  }

  // ===========================
  // PAYOUT MANAGEMENT
  // ===========================

  async createPayout(dto: CreatePayoutDTO) {
    try {
      const useCase = new HunterUseCases.CreatePayoutUseCase(
        this.payoutRepo,
        this.commissionRepo,
        this.hunterRepo,
        this.ledgerRepo
      );
      const payout = await useCase.execute(dto);

      return apiResponse.success({
        data: payout,
        message: 'Payout created successfully',
      });
    } catch (error: any) {
      console.error('Create payout error:', error);
      return apiResponse.forbidden(error.message);
    }
  }

  async processPayout(dto: UpdatePayoutStatusDTO) {
    try {
      const useCase = new HunterUseCases.ProcessPayoutUseCase(
        this.payoutRepo,
        this.commissionRepo,
        this.hunterRepo,
        this.ledgerRepo
      );
      const payout = await useCase.execute(dto);

      return apiResponse.success({
        data: payout,
        message: 'Payout processed successfully',
      });
    } catch (error: any) {
      console.error('Process payout error:', error);
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.forbidden(error.message);
    }
  }

  async getPayoutsByHunter(
    hunterId: string,
    params?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const useCase = new HunterUseCases.GetPayoutsByHunterUseCase(this.payoutRepo);
      const payouts = await useCase.execute(hunterId, params as any);

      return apiResponse.success({
        data: payouts,
        message: 'Payouts retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get payouts error:', error);
      return apiResponse.internalError();
    }
  }

  async getPendingPayouts(limit?: number) {
    try {
      const useCase = new HunterUseCases.GetPendingPayoutsUseCase(this.payoutRepo);
      const payouts = await useCase.execute(limit);

      return apiResponse.success({
        data: payouts,
        message: 'Pending payouts retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get pending payouts error:', error);
      return apiResponse.internalError();
    }
  }

  // ===========================
  // LEDGER MANAGEMENT
  // ===========================

  async recordLedgerEntry(dto: CreateLedgerEntryDTO) {
    try {
      const useCase = new HunterUseCases.RecordLedgerEntryUseCase(this.ledgerRepo);
      const entry = await useCase.execute(dto);

      return apiResponse.success({
        data: entry,
        message: 'Ledger entry recorded successfully',
      });
    } catch (error: any) {
      console.error('Record ledger entry error:', error);
      return apiResponse.internalError();
    }
  }

  async getLedgerEntries(params: {
    dateFrom?: Date;
    dateTo?: Date;
    category?: LedgerCategory;
    hunterId?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const useCase = new HunterUseCases.GetLedgerEntriesUseCase(this.ledgerRepo);
      const entries = await useCase.execute(params);

      return apiResponse.success({
        data: entries,
        message: 'Ledger entries retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get ledger entries error:', error);
      return apiResponse.internalError();
    }
  }

  async getLedgerSummary(dateFrom?: Date, dateTo?: Date) {
    try {
      const useCase = new HunterUseCases.GetLedgerSummaryUseCase(this.ledgerRepo);
      const summary = await useCase.execute(dateFrom, dateTo);

      return apiResponse.success({
        data: summary,
        message: 'Ledger summary retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get ledger summary error:', error);
      return apiResponse.internalError();
    }
  }

  async getSystemBalance() {
    try {
      const useCase = new HunterUseCases.GetSystemBalanceUseCase(this.ledgerRepo);
      const balance = await useCase.execute();

      return apiResponse.success({
        data: { balance },
        message: 'System balance retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get system balance error:', error);
      return apiResponse.internalError();
    }
  }

  async getHunterLedger(hunterId: string, dateFrom?: Date, dateTo?: Date, limit?: number) {
    try {
      const useCase = new HunterUseCases.GetHunterLedgerUseCase(this.ledgerRepo);
      const entries = await useCase.execute(hunterId, dateFrom, dateTo, limit);

      return apiResponse.success({
        data: entries,
        message: 'Hunter ledger retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get hunter ledger error:', error);
      return apiResponse.internalError();
    }
  }

  async getTenantLedger(tenantId: string, dateFrom?: Date, dateTo?: Date, limit?: number) {
    try {
      const useCase = new HunterUseCases.GetTenantLedgerUseCase(this.ledgerRepo);
      const entries = await useCase.execute(tenantId, dateFrom, dateTo, limit);

      return apiResponse.success({
        data: entries,
        message: 'Tenant ledger retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get tenant ledger error:', error);
      return apiResponse.internalError();
    }
  }

  // ===========================
  // WEBHOOK/EVENT HANDLER
  // ===========================

  async handleDonationSettlement(donationId: string, donation: {
    tenantId: string;
    amount: number;
    netAmount: number; // Amount after transaction fees
    transactionFee: number;
    hunterReferralCode?: string;
  }) {
    try {
      const useCase = new HunterUseCases.HandleDonationSettlementUseCase(
        this.hunterRepo,
        this.commissionRepo,
        this.ledgerRepo
      );
      const commission = await useCase.execute(donationId, donation);

      return commission;
    } catch (error: any) {
      console.error('Handle donation settlement error:', error);
      return null;
    }
  }
}
