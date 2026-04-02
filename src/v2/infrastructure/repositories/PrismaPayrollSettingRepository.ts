import { PayrollSetting } from '../../domain/entities/PayrollSetting';
import { PayrollSettingRepository } from '../../domain/repositories/PayrollRepository';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class PrismaPayrollSettingRepository implements PayrollSettingRepository {
  private static instance: PrismaPayrollSettingRepository;

  private constructor() {}

  public static getInstance(): PrismaPayrollSettingRepository {
    if (!PrismaPayrollSettingRepository.instance) {
      PrismaPayrollSettingRepository.instance = new PrismaPayrollSettingRepository();
    }
    return PrismaPayrollSettingRepository.instance;
  }

  async findByTenant(tenantId: string): Promise<PayrollSetting | null> {
    try {
      const setting = await prisma.payrollSetting.findUnique({
        where: { tenantId }
      });

      if (!setting) return null;
      return this.mapToEntity(setting);
    } catch (error) {
      console.error('Error finding payroll setting by tenant:', error);
      throw new Error(`Failed to find payroll setting for tenant: ${tenantId}`);
    }
  }

  async create(setting: PayrollSetting): Promise<PayrollSetting> {
    try {
      const created = await prisma.payrollSetting.create({
        data: {
          tenantId: setting.tenantId,
          ump: setting.ump ? new Decimal(setting.ump) : null,
          normalWorkHoursPerDay: setting.normalWorkHoursPerDay,
          normalWorkHoursPerMonth: setting.normalWorkHoursPerMonth,
          overtimeRate1: new Decimal(setting.overtimeRate1),
          overtimeRate2: new Decimal(setting.overtimeRate2),
          overtimeRateWeekend1: new Decimal(setting.overtimeRateWeekend1),
          overtimeRateWeekend2: new Decimal(setting.overtimeRateWeekend2),
          overtimeRateWeekend3: new Decimal(setting.overtimeRateWeekend3),
          overtimeCalculationType: setting.overtimeCalculationType
        }
      });

      return this.mapToEntity(created);
    } catch (error) {
      console.error('Error creating payroll setting:', error);
      throw new Error('Failed to create payroll setting');
    }
  }

  async update(tenantId: string, setting: PayrollSetting): Promise<PayrollSetting> {
    try {
      const updated = await prisma.payrollSetting.update({
        where: { tenantId },
        data: {
          ump: setting.ump ? new Decimal(setting.ump) : null,
          normalWorkHoursPerDay: setting.normalWorkHoursPerDay,
          normalWorkHoursPerMonth: setting.normalWorkHoursPerMonth,
          overtimeRate1: new Decimal(setting.overtimeRate1),
          overtimeRate2: new Decimal(setting.overtimeRate2),
          overtimeRateWeekend1: new Decimal(setting.overtimeRateWeekend1),
          overtimeRateWeekend2: new Decimal(setting.overtimeRateWeekend2),
          overtimeRateWeekend3: new Decimal(setting.overtimeRateWeekend3),
          overtimeCalculationType: setting.overtimeCalculationType,
          updatedAt: new Date()
        }
      });

      return this.mapToEntity(updated);
    } catch (error) {
      console.error('Error updating payroll setting:', error);
      throw new Error('Failed to update payroll setting');
    }
  }

  async delete(tenantId: string): Promise<void> {
    try {
      await prisma.payrollSetting.delete({
        where: { tenantId }
      });
    } catch (error) {
      console.error('Error deleting payroll setting:', error);
      throw new Error('Failed to delete payroll setting');
    }
  }

  private mapToEntity(prismaPayrollSetting: any): PayrollSetting {
    return PayrollSetting.create(
      prismaPayrollSetting.id,
      prismaPayrollSetting.tenantId,
      prismaPayrollSetting.ump?.toNumber() || null,
      prismaPayrollSetting.normalWorkHoursPerDay,
      prismaPayrollSetting.normalWorkHoursPerMonth,
      prismaPayrollSetting.overtimeRate1.toNumber(),
      prismaPayrollSetting.overtimeRate2.toNumber(),
      prismaPayrollSetting.overtimeRateWeekend1.toNumber(),
      prismaPayrollSetting.overtimeRateWeekend2.toNumber(),
      prismaPayrollSetting.overtimeRateWeekend3.toNumber(),
      prismaPayrollSetting.overtimeCalculationType,
      prismaPayrollSetting.createdAt,
      prismaPayrollSetting.updatedAt
    );
  }
}