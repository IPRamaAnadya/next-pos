import { PayrollPeriod } from '../../domain/entities/PayrollPeriod';
import { PayrollPeriodRepository } from '../../domain/repositories/PayrollRepository';
import prisma from '@/lib/prisma';

export class PrismaPayrollPeriodRepository implements PayrollPeriodRepository {
  private static instance: PrismaPayrollPeriodRepository;

  private constructor() {}

  public static getInstance(): PrismaPayrollPeriodRepository {
    if (!PrismaPayrollPeriodRepository.instance) {
      PrismaPayrollPeriodRepository.instance = new PrismaPayrollPeriodRepository();
    }
    return PrismaPayrollPeriodRepository.instance;
  }

  async findById(id: string): Promise<PayrollPeriod | null> {
    try {
      const period = await prisma.payrollPeriod.findUnique({
        where: { id }
      });

      if (!period) return null;
      return this.mapToEntity(period);
    } catch (error) {
      console.error('Error finding payroll period by ID:', error);
      throw new Error(`Failed to find payroll period with ID: ${id}`);
    }
  }

  async findByTenant(tenantId: string, includeFinalized: boolean = true): Promise<PayrollPeriod[]> {
    try {
      const whereClause: any = { tenantId };
      if (!includeFinalized) {
        whereClause.isFinalized = false;
      }

      const periods = await prisma.payrollPeriod.findMany({
        where: whereClause,
        orderBy: { periodStart: 'desc' }
      });

      return periods.map(period => this.mapToEntity(period));
    } catch (error) {
      console.error('Error finding payroll periods by tenant:', error);
      throw new Error(`Failed to find payroll periods for tenant: ${tenantId}`);
    }
  }

  async findCurrent(tenantId: string): Promise<PayrollPeriod | null> {
    try {
      const now = new Date();
      const period = await prisma.payrollPeriod.findFirst({
        where: {
          tenantId,
          periodStart: { lte: now },
          periodEnd: { gte: now }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!period) return null;
      return this.mapToEntity(period);
    } catch (error) {
      console.error('Error finding current payroll period:', error);
      throw new Error(`Failed to find current payroll period for tenant: ${tenantId}`);
    }
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<PayrollPeriod[]> {
    try {
      const periods = await prisma.payrollPeriod.findMany({
        where: {
          tenantId,
          OR: [
            {
              AND: [
                { periodStart: { lte: endDate } },
                { periodEnd: { gte: startDate } }
              ]
            }
          ]
        },
        orderBy: { periodStart: 'asc' }
      });

      return periods.map(period => this.mapToEntity(period));
    } catch (error) {
      console.error('Error finding payroll periods by date range:', error);
      throw new Error(`Failed to find payroll periods in date range`);
    }
  }

  async findOverlapping(tenantId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<PayrollPeriod[]> {
    try {
      const whereClause: any = {
        tenantId,
        OR: [
          {
            AND: [
              { periodStart: { lte: endDate } },
              { periodEnd: { gte: startDate } }
            ]
          }
        ]
      };

      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const periods = await prisma.payrollPeriod.findMany({
        where: whereClause,
        orderBy: { periodStart: 'asc' }
      });

      return periods.map(period => this.mapToEntity(period));
    } catch (error) {
      console.error('Error finding overlapping payroll periods:', error);
      throw new Error(`Failed to find overlapping payroll periods`);
    }
  }

  async create(period: PayrollPeriod): Promise<PayrollPeriod> {
    try {
      const created = await prisma.payrollPeriod.create({
        data: {
          tenantId: period.tenantId,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          isFinalized: period.isFinalized
        }
      });

      return this.mapToEntity(created);
    } catch (error) {
      console.error('Error creating payroll period:', error);
      throw new Error('Failed to create payroll period');
    }
  }

  async update(id: string, period: PayrollPeriod): Promise<PayrollPeriod> {
    try {
      const updated = await prisma.payrollPeriod.update({
        where: { id },
        data: {
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          isFinalized: period.isFinalized
        }
      });

      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error updating payroll period:', error);
      throw new Error('Failed to update payroll period');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.payrollPeriod.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting payroll period:', error);
      throw new Error('Failed to delete payroll period');
    }
  }

  async finalize(id: string): Promise<PayrollPeriod> {
    try {
      const updated = await prisma.payrollPeriod.update({
        where: { id },
        data: {
          isFinalized: true,
          updatedAt: new Date()
        }
      });

      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error finalizing payroll period:', error);
      throw new Error('Failed to finalize payroll period');
    }
  }

  private mapToEntity(prismaPayrollPeriod: any): PayrollPeriod {
    return PayrollPeriod.create(
      prismaPayrollPeriod.id,
      prismaPayrollPeriod.tenantId,
      prismaPayrollPeriod.periodStart,
      prismaPayrollPeriod.periodEnd,
      prismaPayrollPeriod.isFinalized,
      prismaPayrollPeriod.createdAt,
      prismaPayrollPeriod.updatedAt
    );
  }
}