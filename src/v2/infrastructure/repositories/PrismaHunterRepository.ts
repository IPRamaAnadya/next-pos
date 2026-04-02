/**
 * Prisma implementations of Hunter repositories
 */

import prisma from '@/lib/prisma';
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
  CommissionStatus,
  PayoutStatus,
  LedgerCategory,
} from '@/domain/entities/Hunter';
import type {
  HunterRepository,
  HunterCommissionRepository,
  HunterPayoutRepository,
  SystemLedgerRepository,
} from '@/domain/repositories/HunterRepository';

/**
 * Prisma implementation of HunterRepository
 */
export class PrismaHunterRepository implements HunterRepository {
  async create(dto: CreateHunterDTO): Promise<Hunter> {
    const referralCode = await this.generateReferralCode();
    
    const hunter = await prisma.hunter.create({
      data: {
        userId: dto.userId,
        adminId: dto.adminId,
        referralCode,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        commissionPercentage: dto.commissionPercentage,
        bankAccountName: dto.bankAccountName,
        bankAccountNumber: dto.bankAccountNumber,
        bankName: dto.bankName,
        notes: dto.notes,
      },
    });

    return this.mapToEntity(hunter);
  }

  async update(id: string, dto: UpdateHunterDTO): Promise<Hunter> {
    const hunter = await prisma.hunter.update({
      where: { id },
      data: dto,
    });

    return this.mapToEntity(hunter);
  }

  async findById(id: string): Promise<Hunter | null> {
    const hunter = await prisma.hunter.findUnique({
      where: { id },
    });

    return hunter ? this.mapToEntity(hunter) : null;
  }

  async findByReferralCode(referralCode: string): Promise<Hunter | null> {
    const hunter = await prisma.hunter.findUnique({
      where: { referralCode },
    });

    return hunter ? this.mapToEntity(hunter) : null;
  }

  async findByEmail(email: string): Promise<Hunter | null> {
    const hunter = await prisma.hunter.findUnique({
      where: { email },
    });

    return hunter ? this.mapToEntity(hunter) : null;
  }

  async findByUserId(userId: string): Promise<Hunter | null> {
    const hunter = await prisma.hunter.findUnique({
      where: { userId },
    });

    return hunter ? this.mapToEntity(hunter) : null;
  }

  async findAll(params: {
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
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    
    if (params.adminId) {
      where.adminId = params.adminId;
    }
    
    if (params.searchQuery) {
      where.OR = [
        { name: { contains: params.searchQuery, mode: 'insensitive' } },
        { email: { contains: params.searchQuery, mode: 'insensitive' } },
        { referralCode: { contains: params.searchQuery, mode: 'insensitive' } },
      ];
    }

    const [hunters, total] = await Promise.all([
      prisma.hunter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hunter.count({ where }),
    ]);

    return {
      hunters: hunters.map((h: any) => this.mapToEntity(h)),
      total,
      page,
      limit,
    };
  }

  async getStatistics(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<HunterStatistics> {
    const hunter = await prisma.hunter.findUnique({
      where: { id: hunterId },
      select: {
        name: true,
        totalEarnings: true,
        totalPaidOut: true,
      },
    });

    if (!hunter) {
      throw new Error('Hunter not found');
    }

    const where: any = { hunterId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Count total referrals
    const totalReferrals = await prisma.tenant.count({
      where: {
        hunter: { id: hunterId },
      },
    });

    // Calculate total donations from referred tenants
    const tenants = await prisma.tenant.findMany({
      where: { hunter: { id: hunterId } },
      select: { id: true },
    });

    const tenantIds = tenants.map((t: any) => t.id);

    const donationsAggregate = await prisma.tenantDonation.aggregate({
      where: {
        tenantId: { in: tenantIds },
        status: 'PAID', // Changed from SETTLEMENT to match DonationStatus enum
        ...(dateFrom || dateTo
          ? {
              settlementTime: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amount: true,
      },
    });

    // Get commission summary
    const [totalCommissionsEarned, totalCommissionsPaid, pendingCommissions] = await Promise.all([
      prisma.hunterCommission.aggregate({
        where: { ...where },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.aggregate({
        where: { hunterId, status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),
    ]);

    return {
      hunterId,
      hunterName: hunter.name,
      totalReferrals,
      totalDonations: donationsAggregate._sum?.amount?.toNumber() || 0,
      totalCommissionsEarned: totalCommissionsEarned._sum?.commissionAmount?.toNumber() || 0,
      totalCommissionsPaid: totalCommissionsPaid._sum?.commissionAmount?.toNumber() || 0,
      pendingCommissions: pendingCommissions._sum?.commissionAmount?.toNumber() || 0,
      availableBalance: hunter.totalEarnings.toNumber() - hunter.totalPaidOut.toNumber(),
    };
  }

  async deactivate(id: string): Promise<void> {
    await prisma.hunter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async generateReferralCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    while (true) {
      code = 'H-';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Check if code already exists
      const existing = await prisma.hunter.findUnique({
        where: { referralCode: code },
      });
      
      if (!existing) break;
    }
    
    return code;
  }

  async updateEarnings(hunterId: string, earningsChange: number): Promise<void> {
    await prisma.hunter.update({
      where: { id: hunterId },
      data: {
        totalEarnings: {
          increment: earningsChange,
        },
      },
    });
  }

  async updatePaidOut(hunterId: string, paidOutChange: number): Promise<void> {
    await prisma.hunter.update({
      where: { id: hunterId },
      data: {
        totalPaidOut: {
          increment: paidOutChange,
        },
      },
    });
  }

  private mapToEntity(hunter: any): Hunter {
    return {
      id: hunter.id,
      userId: hunter.userId,
      adminId: hunter.adminId,
      referralCode: hunter.referralCode,
      name: hunter.name,
      email: hunter.email,
      phone: hunter.phone,
      commissionPercentage: hunter.commissionPercentage.toNumber(),
      isActive: hunter.isActive,
      totalEarnings: hunter.totalEarnings.toNumber(),
      totalPaidOut: hunter.totalPaidOut.toNumber(),
      bankAccountName: hunter.bankAccountName,
      bankAccountNumber: hunter.bankAccountNumber,
      bankName: hunter.bankName,
      notes: hunter.notes,
      createdAt: hunter.createdAt,
      updatedAt: hunter.updatedAt,
    };
  }
}

/**
 * Prisma implementation of HunterCommissionRepository
 */
export class PrismaHunterCommissionRepository implements HunterCommissionRepository {
  async create(dto: CreateCommissionDTO): Promise<HunterCommission> {
    const commissionAmount = (dto.donationAmount * dto.commissionRate) / 100;

    const commission = await prisma.hunterCommission.create({
      data: {
        hunterId: dto.hunterId,
        tenantId: dto.tenantId,
        donationId: dto.donationId,
        donationAmount: dto.donationAmount,
        commissionRate: dto.commissionRate,
        commissionAmount,
        status: 'PENDING',
      },
    });

    return this.mapToEntity(commission);
  }

  async updateStatus(dto: UpdateCommissionStatusDTO): Promise<HunterCommission> {
    const data: any = {
      status: dto.status,
      notes: dto.notes,
    };

    if (dto.status === 'PAID') {
      data.paidOutAt = new Date();
    }

    const commission = await prisma.hunterCommission.update({
      where: { id: dto.commissionId },
      data,
    });

    return this.mapToEntity(commission);
  }

  async findById(id: string): Promise<HunterCommission | null> {
    const commission = await prisma.hunterCommission.findUnique({
      where: { id },
    });

    return commission ? this.mapToEntity(commission) : null;
  }

  async findByDonationId(donationId: string): Promise<HunterCommission | null> {
    const commission = await prisma.hunterCommission.findFirst({
      where: { donationId },
    });

    return commission ? this.mapToEntity(commission) : null;
  }

  async findByHunterId(
    hunterId: string,
    params?: {
      status?: CommissionStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterCommission[]> {
    const where: any = { hunterId };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.dateFrom || params?.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = params.dateFrom;
      if (params.dateTo) where.createdAt.lte = params.dateTo;
    }

    const commissions = await prisma.hunterCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return commissions.map((c: any) => this.mapToEntity(c));
  }

  async findByTenantId(
    tenantId: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterCommission[]> {
    const commissions = await prisma.hunterCommission.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return commissions.map((c: any) => this.mapToEntity(c));
  }

  async getSummary(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CommissionSummary> {
    const where: any = { hunterId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [pending, approved, paid, cancelled, counts] = await Promise.all([
      prisma.hunterCommission.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.aggregate({
        where: { ...where, status: 'CANCELLED' },
        _sum: { commissionAmount: true },
      }),
      prisma.hunterCommission.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    const countMap: any = {
      pending: 0,
      approved: 0,
      paid: 0,
      cancelled: 0,
    };

    counts.forEach((c: any) => {
      countMap[c.status.toLowerCase()] = c._count;
    });

    const total = await prisma.hunterCommission.aggregate({
      where,
      _sum: { commissionAmount: true },
    });

    return {
      totalCommissions: total._sum.commissionAmount?.toNumber() || 0,
      pendingAmount: pending._sum.commissionAmount?.toNumber() || 0,
      approvedAmount: approved._sum.commissionAmount?.toNumber() || 0,
      paidAmount: paid._sum.commissionAmount?.toNumber() || 0,
      cancelledAmount: cancelled._sum.commissionAmount?.toNumber() || 0,
      count: countMap,
    };
  }

  async findPendingForPayout(hunterId: string): Promise<HunterCommission[]> {
    const commissions = await prisma.hunterCommission.findMany({
      where: {
        hunterId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return commissions.map((c: any) => this.mapToEntity(c));
  }

  async markAsPaid(commissionIds: string[], paidOutAt: Date): Promise<void> {
    await prisma.hunterCommission.updateMany({
      where: {
        id: { in: commissionIds },
      },
      data: {
        status: 'PAID',
        paidOutAt,
      },
    });
  }

  async calculateTotal(hunterId: string, status?: CommissionStatus): Promise<number> {
    const where: any = { hunterId };
    if (status) {
      where.status = status;
    }

    const result = await prisma.hunterCommission.aggregate({
      where,
      _sum: { commissionAmount: true },
    });

    return result._sum.commissionAmount?.toNumber() || 0;
  }

  private mapToEntity(commission: any): HunterCommission {
    return {
      id: commission.id,
      hunterId: commission.hunterId,
      tenantId: commission.tenantId,
      donationId: commission.donationId,
      donationAmount: commission.donationAmount.toNumber(),
      commissionRate: commission.commissionRate.toNumber(),
      commissionAmount: commission.commissionAmount.toNumber(),
      status: commission.status,
      paidOutAt: commission.paidOutAt,
      notes: commission.notes,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
    };
  }
}

/**
 * Prisma implementation of HunterPayoutRepository
 */
export class PrismaHunterPayoutRepository implements HunterPayoutRepository {
  async create(dto: CreatePayoutDTO): Promise<HunterPayout> {
    const payout = await prisma.hunterPayout.create({
      data: {
        hunterId: dto.hunterId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        status: 'PENDING',
        processedBy: dto.processedBy,
        notes: dto.notes,
      },
    });

    return this.mapToEntity(payout);
  }

  async updateStatus(dto: UpdatePayoutStatusDTO): Promise<HunterPayout> {
    const data: any = {
      status: dto.status,
      notes: dto.notes,
    };

    if (dto.processedBy) {
      data.processedBy = dto.processedBy;
    }

    if (dto.referenceNumber) {
      data.referenceNumber = dto.referenceNumber;
    }

    if (dto.status === 'COMPLETED') {
      data.processedAt = new Date();
    }

    const payout = await prisma.hunterPayout.update({
      where: { id: dto.payoutId },
      data,
    });

    return this.mapToEntity(payout);
  }

  async findById(id: string): Promise<HunterPayout | null> {
    const payout = await prisma.hunterPayout.findUnique({
      where: { id },
    });

    return payout ? this.mapToEntity(payout) : null;
  }

  async findByHunterId(
    hunterId: string,
    params?: {
      status?: PayoutStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<HunterPayout[]> {
    const where: any = { hunterId };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.dateFrom || params?.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = params.dateFrom;
      if (params.dateTo) where.createdAt.lte = params.dateTo;
    }

    const payouts = await prisma.hunterPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return payouts.map((p: any) => this.mapToEntity(p));
  }

  async findPendingPayouts(limit?: number): Promise<HunterPayout[]> {
    const payouts = await prisma.hunterPayout.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return payouts.map((p: any) => this.mapToEntity(p));
  }

  async calculateTotal(hunterId: string, status?: PayoutStatus): Promise<number> {
    const where: any = { hunterId };
    if (status) {
      where.status = status;
    }

    const result = await prisma.hunterPayout.aggregate({
      where,
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  private mapToEntity(payout: any): HunterPayout {
    return {
      id: payout.id,
      hunterId: payout.hunterId,
      amount: payout.amount.toNumber(),
      paymentMethod: payout.paymentMethod,
      referenceNumber: payout.referenceNumber,
      status: payout.status,
      processedBy: payout.processedBy,
      processedAt: payout.processedAt,
      notes: payout.notes,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    };
  }
}

/**
 * Prisma implementation of SystemLedgerRepository
 */
export class PrismaSystemLedgerRepository implements SystemLedgerRepository {
  async create(dto: CreateLedgerEntryDTO): Promise<SystemLedger> {
    // Get current balance
    const currentBalance = await this.getCurrentBalance();
    
    // Calculate new balance
    const balanceChange = dto.transactionType === 'CREDIT' ? dto.amount : -dto.amount;
    const newBalance = currentBalance + balanceChange;

    const ledger = await prisma.systemLedger.create({
      data: {
        transactionType: dto.transactionType,
        category: dto.category,
        amount: dto.amount,
        balance: newBalance,
        description: dto.description,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        hunterId: dto.hunterId,
        tenantId: dto.tenantId,
        donationId: dto.donationId,
        commissionId: dto.commissionId,
        payoutId: dto.payoutId,
        metadata: dto.metadata,
      },
    });

    return this.mapToEntity(ledger);
  }

  async findAll(params: {
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
    const where: any = {};

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = params.dateFrom;
      if (params.dateTo) where.createdAt.lte = params.dateTo;
    }

    if (params.category) where.category = params.category;
    if (params.hunterId) where.hunterId = params.hunterId;
    if (params.tenantId) where.tenantId = params.tenantId;
    if (params.referenceType) where.referenceType = params.referenceType;
    if (params.referenceId) where.referenceId = params.referenceId;

    const ledgers = await prisma.systemLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit,
      skip: params.offset,
    });

    return ledgers.map((l: any) => this.mapToEntity(l));
  }

  async getSummary(dateFrom?: Date, dateTo?: Date): Promise<LedgerSummary> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [credits, debits, byCategory] = await Promise.all([
      prisma.systemLedger.aggregate({
        where: { ...where, transactionType: 'CREDIT' },
        _sum: { amount: true },
      }),
      prisma.systemLedger.aggregate({
        where: { ...where, transactionType: 'DEBIT' },
        _sum: { amount: true },
      }),
      prisma.systemLedger.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalCredits = credits._sum.amount?.toNumber() || 0;
    const totalDebits = debits._sum.amount?.toNumber() || 0;
    const currentBalance = await this.getCurrentBalance();

    return {
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
      currentBalance,
      byCategory: byCategory.map((c: any) => ({
        category: c.category as LedgerCategory,
        amount: c._sum.amount?.toNumber() || 0,
        count: c._count,
      })),
    };
  }

  async getCurrentBalance(): Promise<number> {
    const latest = await prisma.systemLedger.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });

    return latest?.balance.toNumber() || 0;
  }

  async findByHunterId(
    hunterId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]> {
    const where: any = { hunterId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const ledgers = await prisma.systemLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return ledgers.map((l: any) => this.mapToEntity(l));
  }

  async findByTenantId(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<SystemLedger[]> {
    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const ledgers = await prisma.systemLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return ledgers.map((l: any) => this.mapToEntity(l));
  }

  private mapToEntity(ledger: any): SystemLedger {
    return {
      id: ledger.id,
      transactionType: ledger.transactionType,
      category: ledger.category,
      amount: ledger.amount.toNumber(),
      balance: ledger.balance.toNumber(),
      description: ledger.description,
      referenceType: ledger.referenceType,
      referenceId: ledger.referenceId,
      hunterId: ledger.hunterId,
      tenantId: ledger.tenantId,
      donationId: ledger.donationId,
      commissionId: ledger.commissionId,
      payoutId: ledger.payoutId,
      metadata: ledger.metadata,
      createdAt: ledger.createdAt,
    };
  }
}
