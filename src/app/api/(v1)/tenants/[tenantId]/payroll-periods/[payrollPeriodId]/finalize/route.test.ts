
import { createMocks } from 'node-mocks-http';
import * as handler from './route';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('POST /api/tenants/[tenantId]/payroll-periods/[payrollPeriodId]/finalize', () => {
  const tenantId = 'test-tenant-id';
  const payrollPeriodId = 'test-payroll-period-id';

  beforeEach(async () => {
    jest.clearAllMocks();
    // Optionally, clear test data from DB
  });

  it('returns 400 if tenantId or payrollPeriodId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {},
    });
    // @ts-ignore
    const response = await handler.POST(req, { params: { tenantId: undefined, payrollPeriodId } });
    expect(response.status).toBe(400);
  });

  it('returns 404 if payroll period not found', async () => {
    jest.spyOn(prisma.payrollPeriod, 'findUnique').mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'POST' });
    // @ts-ignore
    const response = await handler.POST(req, { params: { tenantId, payrollPeriodId } });
    expect(response.status).toBe(404);
  });

  it('creates Gaji category if not exists and expenses for each payroll detail', async () => {
    jest.spyOn(prisma.payrollPeriod, 'findUnique').mockResolvedValue({
      id: payrollPeriodId,
      tenantId,
      isFinalized: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    jest.spyOn(prisma.expenseCategory, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prisma.expenseCategory, 'create').mockResolvedValue({
      id: 'gaji-cat-id',
      name: 'Gaji',
      code: 'GAJI',
      tenantId,
      isPrivate: true,
      createdAt: new Date(),
    });
    jest.spyOn(prisma.payrollDetail, 'findMany').mockResolvedValue([
      ({
        id: 'detail1',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId,
        payrollPeriodId,
        staffId: 'staff1',
        paidAt: null,
        basicSalaryAmount: new Decimal(0),
        fixedAllowanceAmount: new Decimal(0),
        overtimeHours: new Decimal(0),
        overtimePay: new Decimal(0),
        bonusAmount: new Decimal(0),
        deductionsAmount: new Decimal(0),
        takeHomePay: new Decimal(100000),
        isPaid: false,
        staff: { username: 'staff1' },
      } as any),
      ({
        id: 'detail2',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId,
        payrollPeriodId,
        staffId: 'staff2',
        paidAt: null,
        basicSalaryAmount: new Decimal(0),
        fixedAllowanceAmount: new Decimal(0),
        overtimeHours: new Decimal(0),
        overtimePay: new Decimal(0),
        bonusAmount: new Decimal(0),
        deductionsAmount: new Decimal(0),
        takeHomePay: new Decimal(0),
        isPaid: false,
        staff: { username: 'staff2' },
      } as any),
    ]);
    const expenseCreate = jest.spyOn(prisma.expense, 'create').mockResolvedValue({
      id: 'expense-id',
      isShow: false,
      tenantId,
      expenseCategoryId: 'gaji-cat-id',
      staffId: 'staff1',
      description: 'Gaji - staff1',
      amount: new Decimal(100000),
      paidAt: new Date(),
      attachmentUrl: null,
      createdAt: new Date(),
      paymentType: 'Cash',
      payrollDetailId: null,
    });
    jest.spyOn(prisma.payrollPeriod, 'update').mockResolvedValue({
      id: payrollPeriodId,
      tenantId,
      isFinalized: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    const { req, res } = createMocks({ method: 'POST' });
    // @ts-ignore
    const response = await handler.POST(req, { params: { tenantId, payrollPeriodId } });
    expect(expenseCreate).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    jest.spyOn(prisma.payrollPeriod, 'findUnique').mockImplementation(() => { throw new Error('fail'); });
    const { req, res } = createMocks({ method: 'POST' });
    // @ts-ignore
    const response = await handler.POST(req, { params: { tenantId, payrollPeriodId } });
    expect(response.status).toBe(500);
  });
});
