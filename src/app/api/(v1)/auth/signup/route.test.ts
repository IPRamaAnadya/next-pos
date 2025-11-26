import { POST } from './route';
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  tenant: { create: jest.fn(), update: jest.fn() },
  tenantSetting: { create: jest.fn() },
  payrollSetting: { create: jest.fn() },
  staff: { create: jest.fn() },
  subscriptionPlan: { findFirst: jest.fn() },
  tenantSubscription: { create: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(require('@/lib/prisma'))),
}));
jest.mock('bcryptjs', () => ({ hash: jest.fn() }));

describe('POST /api/auth/signup', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { json: jest.fn() };
  });

  it('should return 400 if required fields are missing', async () => {
    req.json.mockResolvedValue({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 if user already exists', async () => {
    req.json.mockResolvedValue({ email: 'a@b.com', password: 'pass', tenantName: 'Tenant' });
    const prisma = require('@/lib/prisma');
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 200 on successful signup', async () => {
    req.json.mockResolvedValue({ email: 'a@b.com', password: 'pass', tenantName: 'Tenant' });
    const prisma = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    prisma.tenant.create.mockResolvedValue({ id: 't1' });
    prisma.tenantSetting.create.mockResolvedValue({});
    prisma.payrollSetting.create.mockResolvedValue({});
    prisma.staff.create.mockResolvedValue({});
    prisma.subscriptionPlan.findFirst.mockResolvedValue({ id: 'plan1' });
    prisma.tenantSubscription.create.mockResolvedValue({});
    prisma.tenant.update.mockResolvedValue({});
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('should return 500 on error', async () => {
    req.json.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
