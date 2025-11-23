/**
 * Infrastructure: Prisma Donation Repository Implementation
 * Implements donation data access using Prisma ORM
 */

import prisma from "@/lib/prisma";
import {
  Donation,
  DonationStatus,
  MonthlyDonationSummary,
  DonationStatistics,
} from "@/domain/entities/Donation";
import {
  DonationRepository,
  CreateDonationParams,
  UpdateDonationStatusParams,
  DonationFilters,
} from "@/domain/repositories/DonationRepository";

export class PrismaDonationRepository implements DonationRepository {
  private static instance: PrismaDonationRepository;

  private constructor() {}

  public static getInstance(): PrismaDonationRepository {
    if (!PrismaDonationRepository.instance) {
      PrismaDonationRepository.instance = new PrismaDonationRepository();
    }
    return PrismaDonationRepository.instance;
  }

  /**
   * Map Prisma donation to domain entity
   */
  private mapToDomain(prismaDonation: any): Donation {
    return new Donation(
      prismaDonation.id,
      prismaDonation.tenantId,
      prismaDonation.paymentMethodId,
      prismaDonation.midtransOrderId,
      prismaDonation.snapToken,
      prismaDonation.amount.toNumber(),
      prismaDonation.transactionFee.toNumber(),
      prismaDonation.netAmount.toNumber(),
      prismaDonation.status as DonationStatus,
      prismaDonation.paymentType,
      prismaDonation.transactionTime,
      prismaDonation.settlementTime,
      prismaDonation.expiryTime,
      prismaDonation.message,
      prismaDonation.midtransResponse,
      prismaDonation.createdAt,
      prismaDonation.updatedAt
    );
  }

  async create(params: CreateDonationParams): Promise<Donation> {
    const donation = await prisma.tenantDonation.create({
      data: {
        tenantId: params.tenantId,
        paymentMethodId: params.paymentMethodId,
        midtransOrderId: params.midtransOrderId,
        snapToken: params.snapToken,
        amount: params.amount,
        transactionFee: params.transactionFee,
        netAmount: params.netAmount,
        message: params.message,
        expiryTime: params.expiryTime,
        status: DonationStatus.PENDING,
      },
    });

    return this.mapToDomain(donation);
  }

  async findById(id: string): Promise<Donation | null> {
    const donation = await prisma.tenantDonation.findUnique({
      where: { id },
      include: {
        paymentMethod: true,
      },
    });

    return donation ? this.mapToDomain(donation) : null;
  }

  async findByMidtransOrderId(orderId: string): Promise<Donation | null> {
    const donation = await prisma.tenantDonation.findUnique({
      where: { midtransOrderId: orderId },
      include: {
        paymentMethod: true,
      },
    });

    return donation ? this.mapToDomain(donation) : null;
  }

  async findByTenantId(
    tenantId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ donations: Donation[]; total: number }> {
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      prisma.tenantDonation.findMany({
        where: { tenantId },
        include: {
          paymentMethod: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tenantDonation.count({
        where: { tenantId },
      }),
    ]);

    return {
      donations: donations.map((d) => this.mapToDomain(d)),
      total,
    };
  }

  async findAll(
    filters: DonationFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ donations: Donation[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentMethodId) {
      where.paymentMethodId = filters.paymentMethodId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [donations, total] = await Promise.all([
      prisma.tenantDonation.findMany({
        where,
        include: {
          paymentMethod: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tenantDonation.count({ where }),
    ]);

    return {
      donations: donations.map((d) => this.mapToDomain(d)),
      total,
    };
  }

  async updateStatus(
    id: string,
    params: UpdateDonationStatusParams
  ): Promise<Donation> {
    const donation = await prisma.tenantDonation.update({
      where: { id },
      data: {
        status: params.status,
        paymentType: params.paymentType,
        transactionTime: params.transactionTime,
        settlementTime: params.settlementTime,
        midtransResponse: params.midtransResponse || undefined,
      },
      include: {
        paymentMethod: true,
      },
    });

    return this.mapToDomain(donation);
  }

  async getMonthlyDonationSummary(
    tenantId: string,
    year: number,
    month: number
  ): Promise<MonthlyDonationSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const donations = await prisma.tenantDonation.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const summary: MonthlyDonationSummary = {
      tenantId,
      year,
      month,
      totalDonations: donations.length,
      totalAmount: 0,
      totalNetAmount: 0,
      successfulDonations: 0,
      pendingDonations: 0,
      failedDonations: 0,
    };

    donations.forEach((donation) => {
      summary.totalAmount += donation.amount.toNumber();
      summary.totalNetAmount += donation.netAmount.toNumber();

      switch (donation.status) {
        case DonationStatus.PAID:
          summary.successfulDonations++;
          break;
        case DonationStatus.PENDING:
          summary.pendingDonations++;
          break;
        case DonationStatus.FAILED:
        case DonationStatus.EXPIRED:
          summary.failedDonations++;
          break;
      }
    });

    return summary;
  }

  async getDonationStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<DonationStatistics> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [donations, paymentMethodStats] = await Promise.all([
      prisma.tenantDonation.findMany({
        where,
        include: {
          paymentMethod: true,
        },
      }),
      prisma.tenantDonation.groupBy({
        by: ["paymentMethodId"],
        where: {
          ...where,
          status: DonationStatus.PAID,
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
    ]);

    const stats: DonationStatistics = {
      totalDonations: donations.length,
      totalAmount: 0,
      totalNetAmount: 0,
      totalTransactionFees: 0,
      byStatus: {
        pending: 0,
        paid: 0,
        failed: 0,
        expired: 0,
      },
      byPaymentMethod: [],
    };

    donations.forEach((donation) => {
      stats.totalAmount += donation.amount.toNumber();
      stats.totalNetAmount += donation.netAmount.toNumber();
      stats.totalTransactionFees += donation.transactionFee.toNumber();

      switch (donation.status) {
        case DonationStatus.PENDING:
          stats.byStatus.pending++;
          break;
        case DonationStatus.PAID:
          stats.byStatus.paid++;
          break;
        case DonationStatus.FAILED:
          stats.byStatus.failed++;
          break;
        case DonationStatus.EXPIRED:
          stats.byStatus.expired++;
          break;
      }
    });

    // Get payment method names
    const paymentMethodIds = paymentMethodStats
      .map((s) => s.paymentMethodId)
      .filter((id): id is string => id !== null);

    if (paymentMethodIds.length > 0) {
      const paymentMethods = await prisma.donationPaymentMethod.findMany({
        where: {
          id: { in: paymentMethodIds },
        },
      });

      const methodMap = new Map(paymentMethods.map((m) => [m.id, m.name]));

      stats.byPaymentMethod = paymentMethodStats.map((stat) => ({
        methodName: stat.paymentMethodId
          ? methodMap.get(stat.paymentMethodId) || "Unknown"
          : "Unknown",
        count: stat._count,
        amount: stat._sum.amount?.toNumber() || 0,
      }));
    }

    return stats;
  }

  async getMonthlyReport(
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
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const donations = await prisma.tenantDonation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: DonationStatus.PAID,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const report = {
      totalDonations: donations.length,
      totalAmount: 0,
      totalNetAmount: 0,
      byTenant: [] as Array<{
        tenantId: string;
        tenantName: string;
        donationCount: number;
        totalAmount: number;
      }>,
    };

    const tenantMap = new Map<
      string,
      { name: string; count: number; amount: number }
    >();

    donations.forEach((donation) => {
      report.totalAmount += donation.amount.toNumber();
      report.totalNetAmount += donation.netAmount.toNumber();

      const tenantId = donation.tenantId;
      const existing = tenantMap.get(tenantId);

      if (existing) {
        existing.count++;
        existing.amount += donation.amount.toNumber();
      } else {
        tenantMap.set(tenantId, {
          name: donation.tenant.name,
          count: 1,
          amount: donation.amount.toNumber(),
        });
      }
    });

    report.byTenant = Array.from(tenantMap.entries()).map(
      ([tenantId, data]) => ({
        tenantId,
        tenantName: data.name,
        donationCount: data.count,
        totalAmount: data.amount,
      })
    );

    return report;
  }

  async getYearlyReport(year: number): Promise<{
    totalDonations: number;
    totalAmount: number;
    totalNetAmount: number;
    byMonth: Array<{
      month: number;
      donationCount: number;
      totalAmount: number;
      totalNetAmount: number;
    }>;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const donations = await prisma.tenantDonation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: DonationStatus.PAID,
      },
    });

    const report = {
      totalDonations: donations.length,
      totalAmount: 0,
      totalNetAmount: 0,
      byMonth: [] as Array<{
        month: number;
        donationCount: number;
        totalAmount: number;
        totalNetAmount: number;
      }>,
    };

    // Initialize all months
    const monthMap = new Map<
      number,
      { count: number; amount: number; netAmount: number }
    >();
    for (let i = 1; i <= 12; i++) {
      monthMap.set(i, { count: 0, amount: 0, netAmount: 0 });
    }

    donations.forEach((donation) => {
      report.totalAmount += donation.amount.toNumber();
      report.totalNetAmount += donation.netAmount.toNumber();

      const month = donation.createdAt.getMonth() + 1;
      const monthData = monthMap.get(month)!;
      monthData.count++;
      monthData.amount += donation.amount.toNumber();
      monthData.netAmount += donation.netAmount.toNumber();
    });

    report.byMonth = Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      donationCount: data.count,
      totalAmount: data.amount,
      totalNetAmount: data.netAmount,
    }));

    return report;
  }

  async markExpiredDonations(): Promise<number> {
    const now = new Date();

    const result = await prisma.tenantDonation.updateMany({
      where: {
        status: DonationStatus.PENDING,
        expiryTime: {
          not: null,
          lte: now,
        },
      },
      data: {
        status: DonationStatus.EXPIRED,
      },
    });

    return result.count;
  }
}
