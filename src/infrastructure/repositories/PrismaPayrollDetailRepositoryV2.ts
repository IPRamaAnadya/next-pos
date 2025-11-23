import { PayrollDetail } from '../../domain/entities/PayrollDetail';
import { PayrollDetailRepository as OldPayrollDetailRepository } from '../../domain/repositories/StaffRepository';
import { PayrollDetailRepository } from '../../domain/repositories/PayrollRepository';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class PrismaPayrollDetailRepositoryV2 implements PayrollDetailRepository, OldPayrollDetailRepository {
  private static instance: PrismaPayrollDetailRepositoryV2;

  private constructor() {}

  public static getInstance(): PrismaPayrollDetailRepositoryV2 {
    if (!PrismaPayrollDetailRepositoryV2.instance) {
      PrismaPayrollDetailRepositoryV2.instance = new PrismaPayrollDetailRepositoryV2();
    }
    return PrismaPayrollDetailRepositoryV2.instance;
  }

  // ==================== METHOD OVERLOADING FOR BACKWARD COMPATIBILITY ====================

  // findById overloads
  async findById(id: string): Promise<PayrollDetail | null>;
  async findById(id: string, tenantId: string): Promise<PayrollDetail | null>;
  async findById(id: string, tenantId?: string): Promise<PayrollDetail | null> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const payrollDetail = await prisma.payrollDetail.findUnique({
        where: whereClause,
      });

      if (!payrollDetail) return null;
      return this.mapToEntity(payrollDetail);
    } catch (error) {
      console.error('Error finding payroll detail by ID:', error);
      throw new Error(`Failed to find payroll detail with ID: ${id}`);
    }
  }

  // findByPeriodAndStaff overloads
  async findByPeriodAndStaff(payrollPeriodId: string, staffId: string): Promise<PayrollDetail | null>;
  async findByPeriodAndStaff(payrollPeriodId: string, staffId: string, tenantId: string): Promise<PayrollDetail | null>;
  async findByPeriodAndStaff(payrollPeriodId: string, staffId: string, tenantId?: string): Promise<PayrollDetail | null> {
    try {
      const whereClause: any = {
        payrollPeriodId,
        staffId,
      };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const payrollDetail = await prisma.payrollDetail.findFirst({
        where: whereClause,
      });

      if (!payrollDetail) return null;
      return this.mapToEntity(payrollDetail);
    } catch (error) {
      console.error('Error finding payroll detail by period and staff:', error);
      throw new Error('Failed to find payroll detail');
    }
  }

  // findByPeriod overloads
  async findByPeriod(payrollPeriodId: string): Promise<PayrollDetail[]>;
  async findByPeriod(payrollPeriodId: string, tenantId: string): Promise<PayrollDetail[]>;
  async findByPeriod(payrollPeriodId: string, tenantId?: string): Promise<PayrollDetail[]> {
    try {
      const whereClause: any = { payrollPeriodId };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const payrollDetails = await prisma.payrollDetail.findMany({
        where: whereClause,
        include: {
          staff: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return payrollDetails.map(detail => this.mapToEntity(detail));
    } catch (error) {
      console.error('Error finding payroll details by period:', error);
      throw new Error('Failed to retrieve payroll details');
    }
  }

  // ==================== NEW INTERFACE METHODS ====================

  async findByStaff(staffId: string, includeUnpaid: boolean = true): Promise<PayrollDetail[]> {
    try {
      const whereClause: any = { staffId };
      if (!includeUnpaid) {
        whereClause.isPaid = true;
      }

      const payrollDetails = await prisma.payrollDetail.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return payrollDetails.map(detail => this.mapToEntity(detail));
    } catch (error) {
      console.error('Error finding payroll details by staff:', error);
      throw new Error(`Failed to find payroll details for staff: ${staffId}`);
    }
  }

  async findByTenant(tenantId: string, isPaid?: boolean): Promise<PayrollDetail[]> {
    try {
      const whereClause: any = { tenantId };
      if (isPaid !== undefined) {
        whereClause.isPaid = isPaid;
      }

      const payrollDetails = await prisma.payrollDetail.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return payrollDetails.map(detail => this.mapToEntity(detail));
    } catch (error) {
      console.error('Error finding payroll details by tenant:', error);
      throw new Error(`Failed to find payroll details for tenant: ${tenantId}`);
    }
  }

  async findUnpaidByTenant(tenantId: string): Promise<PayrollDetail[]> {
    return this.findByTenant(tenantId, false);
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<PayrollDetail[]> {
    try {
      const payrollDetails = await prisma.payrollDetail.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return payrollDetails.map(detail => this.mapToEntity(detail));
    } catch (error) {
      console.error('Error finding payroll details by date range:', error);
      throw new Error('Failed to find payroll details in date range');
    }
  }

  // ==================== CREATE METHODS WITH OVERLOADING ====================

  async create(detail: PayrollDetail): Promise<PayrollDetail>;
  async create(data: {
    tenantId: string;
    payrollPeriodId: string;
    staffId: string;
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
  }): Promise<PayrollDetail>;
  async create(detailOrData: PayrollDetail | {
    tenantId: string;
    payrollPeriodId: string;
    staffId: string;
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
  }): Promise<PayrollDetail> {
    try {
      let createData: any;

      if (detailOrData instanceof PayrollDetail) {
        // Called with PayrollDetail entity
        const detail = detailOrData;
        createData = {
          tenantId: detail.tenantId,
          payrollPeriodId: detail.payrollPeriodId,
          staffId: detail.staffId,
          basicSalaryAmount: new Decimal(detail.basicSalaryAmount),
          fixedAllowanceAmount: new Decimal(detail.fixedAllowanceAmount),
          overtimeHours: new Decimal(detail.overtimeHours),
          overtimePay: new Decimal(detail.overtimePay),
          bonusAmount: new Decimal(detail.bonusAmount),
          deductionsAmount: new Decimal(detail.deductionsAmount),
          takeHomePay: new Decimal(detail.takeHomePay),
          isPaid: detail.isPaid,
          paidAt: detail.paidAt,
        };
      } else {
        // Called with plain data object (backward compatibility)
        const data = detailOrData;
        createData = {
          tenantId: data.tenantId,
          payrollPeriodId: data.payrollPeriodId,
          staffId: data.staffId,
          basicSalaryAmount: new Decimal(data.basicSalaryAmount),
          fixedAllowanceAmount: new Decimal(data.fixedAllowanceAmount),
          overtimeHours: new Decimal(data.overtimeHours),
          overtimePay: new Decimal(data.overtimePay),
          bonusAmount: new Decimal(data.bonusAmount),
          deductionsAmount: new Decimal(data.deductionsAmount),
          takeHomePay: new Decimal(data.takeHomePay),
          isPaid: false,
          paidAt: null,
        };
      }

      const created = await prisma.payrollDetail.create({
        data: createData
      });

      return this.mapToEntity(created);
    } catch (error) {
      console.error('Error creating payroll detail:', error);
      throw new Error('Failed to create payroll detail');
    }
  }

  // ==================== UPDATE METHODS WITH OVERLOADING ====================

  async update(id: string, detail: PayrollDetail): Promise<PayrollDetail>;
  async update(id: string, tenantId: string, updates: Partial<{
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
    isPaid: boolean;
    paidAt: Date;
  }>): Promise<PayrollDetail>;
  async update(id: string, detailOrTenantId: PayrollDetail | string, updates?: Partial<{
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
    isPaid: boolean;
    paidAt: Date;
  }>): Promise<PayrollDetail> {
    try {
      let updateData: any;
      let whereClause: any = { id };

      if (detailOrTenantId instanceof PayrollDetail) {
        // Called with PayrollDetail entity
        const detail = detailOrTenantId;
        updateData = {
          basicSalaryAmount: new Decimal(detail.basicSalaryAmount),
          fixedAllowanceAmount: new Decimal(detail.fixedAllowanceAmount),
          overtimeHours: new Decimal(detail.overtimeHours),
          overtimePay: new Decimal(detail.overtimePay),
          bonusAmount: new Decimal(detail.bonusAmount),
          deductionsAmount: new Decimal(detail.deductionsAmount),
          takeHomePay: new Decimal(detail.takeHomePay),
          isPaid: detail.isPaid,
          paidAt: detail.paidAt,
          updatedAt: new Date()
        };
      } else {
        // Called with tenantId and updates (backward compatibility)
        const tenantId = detailOrTenantId;
        whereClause.tenantId = tenantId;
        
        updateData = {};
        if (updates?.basicSalaryAmount !== undefined) updateData.basicSalaryAmount = new Decimal(updates.basicSalaryAmount);
        if (updates?.fixedAllowanceAmount !== undefined) updateData.fixedAllowanceAmount = new Decimal(updates.fixedAllowanceAmount);
        if (updates?.overtimeHours !== undefined) updateData.overtimeHours = new Decimal(updates.overtimeHours);
        if (updates?.overtimePay !== undefined) updateData.overtimePay = new Decimal(updates.overtimePay);
        if (updates?.bonusAmount !== undefined) updateData.bonusAmount = new Decimal(updates.bonusAmount);
        if (updates?.deductionsAmount !== undefined) updateData.deductionsAmount = new Decimal(updates.deductionsAmount);
        if (updates?.takeHomePay !== undefined) updateData.takeHomePay = new Decimal(updates.takeHomePay);
        if (updates?.isPaid !== undefined) updateData.isPaid = updates.isPaid;
        if (updates?.paidAt !== undefined) updateData.paidAt = updates.paidAt;
        updateData.updatedAt = new Date();
      }

      const updated = await prisma.payrollDetail.update({
        where: whereClause,
        data: updateData
      });

      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error updating payroll detail:', error);
      throw new Error('Failed to update payroll detail');
    }
  }

  // ==================== DELETE METHODS WITH OVERLOADING ====================

  async delete(id: string): Promise<void>;
  async delete(id: string, tenantId: string): Promise<void>;
  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      await prisma.payrollDetail.delete({
        where: whereClause
      });
    } catch (error) {
      console.error('Error deleting payroll detail:', error);
      throw new Error('Failed to delete payroll detail');
    }
  }

  // ==================== ADDITIONAL NEW METHODS ====================

  async markAsPaid(id: string): Promise<PayrollDetail> {
    try {
      const updated = await prisma.payrollDetail.update({
        where: { id },
        data: {
          isPaid: true,
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });

      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error marking payroll detail as paid:', error);
      throw new Error('Failed to mark payroll detail as paid');
    }
  }

  async bulkCreate(details: PayrollDetail[]): Promise<PayrollDetail[]> {
    try {
      const createData = details.map(detail => ({
        tenantId: detail.tenantId,
        payrollPeriodId: detail.payrollPeriodId,
        staffId: detail.staffId,
        basicSalaryAmount: new Decimal(detail.basicSalaryAmount),
        fixedAllowanceAmount: new Decimal(detail.fixedAllowanceAmount),
        overtimeHours: new Decimal(detail.overtimeHours),
        overtimePay: new Decimal(detail.overtimePay),
        bonusAmount: new Decimal(detail.bonusAmount),
        deductionsAmount: new Decimal(detail.deductionsAmount),
        takeHomePay: new Decimal(detail.takeHomePay),
        isPaid: detail.isPaid,
        paidAt: detail.paidAt,
      }));

      await prisma.payrollDetail.createMany({
        data: createData
      });

      // Return the created details (Prisma createMany doesn't return data)
      // So we need to fetch them back
      const staffIds = details.map(d => d.staffId);
      const payrollPeriodId = details[0]?.payrollPeriodId;
      
      if (payrollPeriodId) {
        const created = await prisma.payrollDetail.findMany({
          where: {
            payrollPeriodId,
            staffId: { in: staffIds }
          }
        });
        return created.map(detail => this.mapToEntity(detail));
      }

      return [];
    } catch (error) {
      console.error('Error bulk creating payroll details:', error);
      throw new Error('Failed to bulk create payroll details');
    }
  }

  async bulkUpdate(details: { id: string; detail: PayrollDetail }[]): Promise<PayrollDetail[]> {
    try {
      const results: PayrollDetail[] = [];
      
      // Use transaction for bulk updates
      await prisma.$transaction(async (tx) => {
        for (const { id, detail } of details) {
          const updated = await tx.payrollDetail.update({
            where: { id },
            data: {
              basicSalaryAmount: new Decimal(detail.basicSalaryAmount),
              fixedAllowanceAmount: new Decimal(detail.fixedAllowanceAmount),
              overtimeHours: new Decimal(detail.overtimeHours),
              overtimePay: new Decimal(detail.overtimePay),
              bonusAmount: new Decimal(detail.bonusAmount),
              deductionsAmount: new Decimal(detail.deductionsAmount),
              takeHomePay: new Decimal(detail.takeHomePay),
              isPaid: detail.isPaid,
              paidAt: detail.paidAt,
              updatedAt: new Date()
            }
          });
          results.push(this.mapToEntity(updated));
        }
      });

      return results;
    } catch (error) {
      console.error('Error bulk updating payroll details:', error);
      throw new Error('Failed to bulk update payroll details');
    }
  }

  async bulkMarkAsPaid(ids: string[]): Promise<PayrollDetail[]> {
    try {
      const now = new Date();
      await prisma.payrollDetail.updateMany({
        where: { id: { in: ids } },
        data: {
          isPaid: true,
          paidAt: now,
          updatedAt: now
        }
      });

      // Fetch and return updated records
      const updated = await prisma.payrollDetail.findMany({
        where: { id: { in: ids } }
      });

      return updated.map(detail => this.mapToEntity(detail));
    } catch (error) {
      console.error('Error bulk marking payroll details as paid:', error);
      throw new Error('Failed to bulk mark payroll details as paid');
    }
  }

  // ==================== BACKWARD COMPATIBILITY METHODS ====================

  async findAll(tenantId: string, isPaid?: boolean): Promise<PayrollDetail[]> {
    return this.findByTenant(tenantId, isPaid);
  }

  // ==================== ENTITY MAPPING ====================

  private mapToEntity(prismaPayrollDetail: any): PayrollDetail {
    return PayrollDetail.create(
      prismaPayrollDetail.id,
      prismaPayrollDetail.tenantId,
      prismaPayrollDetail.payrollPeriodId,
      prismaPayrollDetail.staffId,
      prismaPayrollDetail.basicSalaryAmount.toNumber(),
      prismaPayrollDetail.fixedAllowanceAmount.toNumber(),
      prismaPayrollDetail.overtimeHours.toNumber(),
      prismaPayrollDetail.overtimePay.toNumber(),
      prismaPayrollDetail.bonusAmount.toNumber(),
      prismaPayrollDetail.deductionsAmount.toNumber(),
      prismaPayrollDetail.isPaid,
      prismaPayrollDetail.paidAt,
      prismaPayrollDetail.createdAt,
      prismaPayrollDetail.updatedAt
    );
  }
}