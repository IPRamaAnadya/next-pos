import { GET } from './route';
jest.mock('@/lib/prisma', () => ({ order: { aggregate: jest.fn() } }));
jest.mock('@/app/api/utils/jwt', () => ({ verifyToken: jest.fn() }));
jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn((date, tz, fmt) => '2025-09-28'),
  fromZonedTime: jest.fn((date, tz) => date),
}));

describe('GET /api/tenants/[tenantId]/summaries/daily-payment-received', () => {
  const tenantId = 'tenant1';
  const token = 'valid.token';
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {
        get: jest.fn((k: string) => {
          if (k === 'authorization') return `Bearer ${token}`;
          if (k === 'X-Timezone-Name') return 'Asia/Jakarta';
          return undefined;
        })
      },
      url: 'http://localhost?start_date=2025-09-28&end_date=2025-09-28',
    };
  });

  it('should return 403 if tenantId mismatch', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(403);
  });

  it('should return 200 and correct daily payment received', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.aggregate.mockResolvedValue({ _sum: { grandTotal: 50000 } });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.daily_payment_received).toBe(50000);
  });

  it('should return 200 and zero if no paid orders', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.aggregate.mockResolvedValue({ _sum: { grandTotal: 0 } });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.daily_payment_received).toBe(0);
  });

  it('should return 500 on error', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.aggregate.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.meta.error).toBe('Internal server error');
  });
});
