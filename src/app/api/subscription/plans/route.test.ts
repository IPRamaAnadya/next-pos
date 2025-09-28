import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  subscriptionPlan: { findMany: jest.fn() },
}));

describe('GET /api/subscription/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and plans', async () => {
    const prisma = require('@/lib/prisma');
    const plans = [{ id: 1 }, { id: 2 }];
    prisma.subscriptionPlan.findMany.mockResolvedValue(plans);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(plans);
  });

  it('should return 500 on error', async () => {
    const prisma = require('@/lib/prisma');
    prisma.subscriptionPlan.findMany.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });
});
