/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

type PayrollCalculationParams = {
  tenantId: string;
  staffId: string;
  payrollPeriodId?: string;
  totalHours?: number;
  useActualWorkHours?: boolean;
  bonusAmount?: number;
  deductionsAmount?: number;
  overtimeType?: 'HOURLY' | 'MONTHLY'; // match enum in schema
};


export async function calculateTakeHomePay(params: PayrollCalculationParams) {
  const { 
    tenantId, 
    staffId, 
    payrollPeriodId,
    totalHours: manualTotalHours, 
    useActualWorkHours = false, 
    bonusAmount = 0, 
    deductionsAmount = 0,
    overtimeType: paramOvertimeType,
  } = params;

  // Pastikan staf valid
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Ambil data gaji staf
  const salary = await prisma.salary.findUnique({ where: { staffId } });
  const basicSalary = salary?.basicSalary.toNumber() || 0;
  const fixedAllowance = salary?.fixedAllowance.toNumber() || 0;

  // Ambil pengaturan gaji dari tenant
  const payrollSetting = await prisma.payrollSetting.findUnique({ where: { tenantId } });
  const normalHoursPerDay = payrollSetting?.normalWorkHoursPerDay || 7;
  const normalHoursPerMonth = payrollSetting?.normalWorkHoursPerMonth || 173;
  // Calculate hourly rate using Math.floor (get floor, no rounding up, no comma)
  const hourlyRate = Math.floor((basicSalary + fixedAllowance) / normalHoursPerMonth);
  // Get overtimeCalculationType from payrollSetting if not provided
  let overtimeType: 'HOURLY' | 'MONTHLY' = paramOvertimeType as any;
  if (!overtimeType) {
    overtimeType = payrollSetting?.overtimeCalculationType || 'HOURLY';
  }

  let totalHours = 0;
  let overtimeHours = new Decimal(0);
  let overtimePay = new Decimal(0);
  let normalWorkDays = 0;

  if (useActualWorkHours && payrollPeriodId) {
    const payrollPeriod = await prisma.payrollPeriod.findUnique({ where: { id: payrollPeriodId } });
    if (!payrollPeriod) {
      throw new Error('Payroll period not found');
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId,
        staffId,
        date: {
          gte: payrollPeriod.periodStart,
          lte: payrollPeriod.periodEnd,
        },
      },
    });

    normalWorkDays = attendances.length;


    for (const att of attendances) {
      let dailyHours = att.totalHours?.toNumber() || 0;
      // Subtract 1 hour for rest/lunch
      dailyHours = Math.max(0, dailyHours - 1);
      totalHours += dailyHours;
      const isWeekend = att.date.getDay() === 0 || att.date.getDay() === 6; // Sunday = 0, Saturday = 6
      const dailyOvertimeHours = dailyHours > normalHoursPerDay ? dailyHours - normalHoursPerDay : 0;
      overtimeHours = overtimeHours.add(dailyOvertimeHours);
      if (overtimeType === 'HOURLY') {
        if (dailyOvertimeHours > 0) {
          if (isWeekend) {
            // Logika untuk lembur akhir pekan
            const rateWeekend1 = payrollSetting?.overtimeRateWeekend1?.toNumber() || 2;
            const rateWeekend2 = payrollSetting?.overtimeRateWeekend2?.toNumber() || 3;
            const rateWeekend3 = payrollSetting?.overtimeRateWeekend3?.toNumber() || 4;
            if (dailyOvertimeHours >= 1) overtimePay = overtimePay.add(new Decimal(hourlyRate * rateWeekend1));
            if (dailyOvertimeHours >= 2) overtimePay = overtimePay.add(new Decimal(hourlyRate * rateWeekend2));
            if (dailyOvertimeHours > 2) {
              const remainingHours = dailyOvertimeHours - 2;
              overtimePay = overtimePay.add(new Decimal(hourlyRate * remainingHours * rateWeekend3));
            }
          } else {
            // Logika untuk lembur hari kerja
            const rate1 = payrollSetting?.overtimeRate1?.toNumber() || 1.5;
            const rate2 = payrollSetting?.overtimeRate2?.toNumber() || 2;
            if (dailyOvertimeHours >= 1) overtimePay = overtimePay.add(new Decimal(hourlyRate * rate1));
            if (dailyOvertimeHours > 1) {
              const remainingHours = dailyOvertimeHours - 1;
              overtimePay = overtimePay.add(new Decimal(hourlyRate * remainingHours * rate2));
            }
          }
        }
      }
      // For monthly, handled after loop
    }
  if (overtimeType === 'MONTHLY') {
      // Overtime is based on monthly total
      const monthlyWorkHours = normalHoursPerMonth;
      const overtimeHourMonthly = totalHours > monthlyWorkHours ? totalHours - monthlyWorkHours : 0;
      overtimeHours = new Decimal(overtimeHourMonthly);
      if (overtimeHourMonthly > 0) {
        const rate1 = payrollSetting?.overtimeRate1?.toNumber() || 1.5;
        overtimePay = new Decimal(hourlyRate * overtimeHourMonthly * rate1);
      }
    }
  } else {
    // Perhitungan untuk input manual
    totalHours = manualTotalHours || 0;
    const normalWorkDaysCount = normalHoursPerMonth / normalHoursPerDay;
    normalWorkDays = normalWorkDaysCount;
  if (overtimeType === 'HOURLY') {
      const calculatedOvertimeHours = totalHours > (normalHoursPerDay * normalWorkDaysCount) ? totalHours - (normalHoursPerDay * normalWorkDaysCount) : 0;
      overtimeHours = new Decimal(calculatedOvertimeHours);
      if (calculatedOvertimeHours > 0) {
        const rate1 = payrollSetting?.overtimeRate1?.toNumber() || 1.5;
        const rate2 = payrollSetting?.overtimeRate2?.toNumber() || 2;
        overtimePay = overtimePay.add(new Decimal(hourlyRate * (calculatedOvertimeHours >= 1 ? 1 : calculatedOvertimeHours) * rate1));
        if (calculatedOvertimeHours > 1) {
          overtimePay = overtimePay.add(new Decimal(hourlyRate * (calculatedOvertimeHours - 1) * rate2));
        }
      }
  } else if (overtimeType === 'MONTHLY') {
      const monthlyWorkHours = normalHoursPerMonth;
      const overtimeHourMonthly = totalHours > monthlyWorkHours ? totalHours - monthlyWorkHours : 0;
      overtimeHours = new Decimal(overtimeHourMonthly);
      if (overtimeHourMonthly > 0) {
        const rate1 = payrollSetting?.overtimeRate1?.toNumber() || 1.5;
        overtimePay = new Decimal(hourlyRate * overtimeHourMonthly * rate1);
      }
    }
  }

  const takeHomePay = new Decimal(basicSalary + fixedAllowance).add(overtimePay).add(new Decimal(bonusAmount)).minus(new Decimal(deductionsAmount));

  return {
    basicSalary,
    fixedAllowance,
    totalHours,
    normalWorkHours: new Decimal(normalHoursPerDay * normalWorkDays),
    overtimeHours: overtimeHours.toNumber(),
    hourlyRate,
    overtimePay: overtimePay.toNumber(),
    bonusAmount: bonusAmount || 0,
    deductionsAmount: deductionsAmount || 0,
    takeHomePay: takeHomePay.toNumber(),
  };
}
