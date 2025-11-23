import { Salary } from '../../domain/entities/Salary';
import { SalaryRepository as OldSalaryRepository } from '../../domain/repositories/StaffRepository';
import { SalaryRepository } from '../../domain/repositories/PayrollRepository';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class PrismaSalaryRepository implements SalaryRepository, OldSalaryRepository {
  private static instance: PrismaSalaryRepository;

  private constructor() {}

  public static getInstance(): PrismaSalaryRepository {
    if (!PrismaSalaryRepository.instance) {
      PrismaSalaryRepository.instance = new PrismaSalaryRepository();
    }
    return PrismaSalaryRepository.instance;
  }

  // ==================== NEW ENHANCED INTERFACE METHODS ====================

  async findById(id: string): Promise<Salary | null> {
    try {
      const salary = await prisma.salary.findUnique({
        where: { id },
        include: { staff: true }
      });

      if (!salary) return null;
      return this.mapToEntity(salary);
    } catch (error) {
      console.error('Error finding salary by ID:', error);
      throw new Error(`Failed to find salary with ID: ${id}`);
    }
  }

  async findByStaff(staffId: string): Promise<Salary | null> {
    try {
      const salary = await prisma.salary.findFirst({
        where: { staffId },
        include: { staff: true }
      });

      if (!salary) return null;
      return this.mapToEntity(salary);
    } catch (error) {
      console.error('Error finding salary by staff ID:', error);
      throw new Error(`Failed to find salary for staff ID: ${staffId}`);
    }
  }

  async findByTenant(tenantId: string): Promise<Salary[]> {
    try {
      const salaries = await prisma.salary.findMany({
        where: { tenantId },
        include: { staff: true }
      });

      return salaries.map(salary => this.mapToEntity(salary));
    } catch (error) {
      console.error('Error finding salaries by tenant:', error);
      throw new Error(`Failed to find salaries for tenant: ${tenantId}`);
    }
  }

  async findByTenantWithPagination(tenantId: string, page: number, limit: number): Promise<{
    salaries: Salary[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const [salaries, total] = await Promise.all([
        prisma.salary.findMany({
          where: { tenantId },
          skip: offset,
          take: limit,
          include: { staff: true }
        }),
        prisma.salary.count({
          where: { tenantId }
        })
      ]);

      return {
        salaries: salaries.map(salary => this.mapToEntity(salary)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error finding salaries with pagination:', error);
      throw new Error(`Failed to find salaries for tenant: ${tenantId}`);
    }
  }

  // Method overloads for create to handle both interfaces
  async create(salary: Salary): Promise<Salary>;
  async create(data: { tenantId: string; staffId: string; basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }): Promise<Salary>;
  async create(input: any): Promise<Salary> {
    try {
      let data;
      if (input instanceof Salary) {
        // New enhanced interface
        data = {
          id: input.id,
          tenantId: input.tenantId,
          staffId: input.staffId,
          basicSalary: new Decimal(input.basicSalary),
          fixedAllowance: new Decimal(input.fixedAllowance),
          type: input.type as any,
        };
      } else {
        // Old interface
        data = {
          tenantId: input.tenantId,
          staffId: input.staffId,
          basicSalary: new Decimal(input.basicSalary),
          fixedAllowance: new Decimal(input.fixedAllowance),
          type: input.type,
        };
      }

      const created = await prisma.salary.create({ 
        data,
        include: { staff: true }
      });
      return this.mapToEntity(created);
    } catch (error) {
      console.error('Error creating salary:', error);
      throw new Error('Failed to create salary');
    }
  }

  // Method overloads for update to handle both interfaces
  async update(staffId: string, salary: Salary): Promise<Salary>;
  async update(staffId: string, tenantId: string, updates: Partial<{ basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }>): Promise<Salary>;
  async update(staffId: string, salaryOrTenantId: any, updates?: any): Promise<Salary> {
    try {
      let updateData;
      let whereClause;

      if (salaryOrTenantId instanceof Salary) {
        // New enhanced interface: update(staffId, salary)
        updateData = {
          basicSalary: new Decimal(salaryOrTenantId.basicSalary),
          fixedAllowance: new Decimal(salaryOrTenantId.fixedAllowance),
          type: salaryOrTenantId.type as any,
        };
        whereClause = { staffId };
      } else {
        // Old interface: update(staffId, tenantId, updates)
        updateData = {} as any;
        if (updates.basicSalary !== undefined) updateData.basicSalary = new Decimal(updates.basicSalary);
        if (updates.fixedAllowance !== undefined) updateData.fixedAllowance = new Decimal(updates.fixedAllowance);
        if (updates.type !== undefined) updateData.type = updates.type;
        whereClause = { staffId, tenantId: salaryOrTenantId };
      }

      const updated = await prisma.salary.update({
        where: whereClause,
        data: updateData,
        include: { staff: true }
      });
      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error updating salary:', error);
      throw new Error(`Failed to update salary for staff ID: ${staffId}`);
    }
  }

  // Method overloads for delete to handle both interfaces
  async delete(staffId: string): Promise<void>;
  async delete(staffId: string, tenantId: string): Promise<void>;
  async delete(staffId: string, tenantId?: string): Promise<void> {
    try {
      const whereClause: any = { staffId };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      await prisma.salary.delete({
        where: whereClause,
      });
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw new Error(`Failed to delete salary for staff ID: ${staffId}`);
    }
  }

  async findAboveAmount(tenantId: string, minimumAmount: number): Promise<Salary[]> {
    try {
      const salaries = await prisma.salary.findMany({
        where: {
          tenantId,
          basicSalary: {
            gte: new Decimal(minimumAmount)
          }
        },
        include: { staff: true }
      });

      return salaries.map(salary => this.mapToEntity(salary));
    } catch (error) {
      console.error('Error finding salaries above amount:', error);
      throw new Error(`Failed to find salaries above ${minimumAmount}`);
    }
  }

  async findBelowAmount(tenantId: string, maximumAmount: number): Promise<Salary[]> {
    try {
      const salaries = await prisma.salary.findMany({
        where: {
          tenantId,
          basicSalary: {
            lte: new Decimal(maximumAmount)
          }
        },
        include: { staff: true }
      });

      return salaries.map(salary => this.mapToEntity(salary));
    } catch (error) {
      console.error('Error finding salaries below amount:', error);
      throw new Error(`Failed to find salaries below ${maximumAmount}`);
    }
  }

  async findByType(tenantId: string, type: 'MONTHLY' | 'DAILY' | 'HOURLY'): Promise<Salary[]> {
    try {
      const salaries = await prisma.salary.findMany({
        where: {
          tenantId,
          type: type as any
        },
        include: { staff: true }
      });

      return salaries.map(salary => this.mapToEntity(salary));
    } catch (error) {
      console.error('Error finding salaries by type:', error);
      throw new Error(`Failed to find salaries of type ${type}`);
    }
  }

  // ==================== OLD INTERFACE METHODS (for backward compatibility) ====================

  async findByStaffId(staffId: string, tenantId: string): Promise<Salary | null> {
    try {
      const salary = await prisma.salary.findUnique({
        where: { staffId, tenantId },
        include: { staff: true }
      });

      if (!salary) return null;
      return this.mapToEntity(salary);
    } catch (error) {
      console.error('Error finding salary by staff ID:', error);
      throw new Error(`Failed to find salary for staff ID: ${staffId}`);
    }
  }

  async createOld(data: { tenantId: string; staffId: string; basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }): Promise<Salary> {
    try {
      const salary = await prisma.salary.create({
        data: {
          tenantId: data.tenantId,
          staffId: data.staffId,
          basicSalary: new Decimal(data.basicSalary),
          fixedAllowance: new Decimal(data.fixedAllowance),
          type: data.type,
        },
        include: { staff: true }
      });
      return this.mapToEntity(salary);
    } catch (error) {
      console.error('Error creating salary:', error);
      throw new Error('Failed to create salary');
    }
  }

  async updateOld(staffId: string, tenantId: string, updates: Partial<{ basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }>): Promise<Salary> {
    try {
      const updateData: any = {};
      if (updates.basicSalary !== undefined) updateData.basicSalary = new Decimal(updates.basicSalary);
      if (updates.fixedAllowance !== undefined) updateData.fixedAllowance = new Decimal(updates.fixedAllowance);
      if (updates.type !== undefined) updateData.type = updates.type;

      const salary = await prisma.salary.update({
        where: { staffId, tenantId },
        data: updateData,
        include: { staff: true }
      });
      return this.mapToEntity(salary);
    } catch (error) {
      console.error('Error updating salary:', error);
      throw new Error(`Failed to update salary for staff ID: ${staffId}`);
    }
  }

  async deleteOld(staffId: string, tenantId: string): Promise<void> {
    try {
      await prisma.salary.delete({
        where: { staffId, tenantId },
      });
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw new Error(`Failed to delete salary for staff ID: ${staffId}`);
    }
  }

  async findAll(tenantId: string): Promise<Salary[]> {
    return this.findByTenant(tenantId);
  }

  // ==================== HELPER METHODS ====================

  private mapToEntity(salary: any): Salary {
    return new Salary(
      salary.id,
      salary.tenantId,
      salary.staffId,
      Number(salary.basicSalary),
      Number(salary.fixedAllowance),
      salary.type,
      salary.createdAt,
      salary.updatedAt
    );
  }
}