import { POST } from './route';
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  staff: { findFirst: jest.fn() },
}));
jest.mock('bcryptjs', () => ({ compareSync: jest.fn() }));
jest.mock('@/app/api/utils/jwt', () => ({ generateToken: jest.fn() }));

describe('POST /api/auth/login/cashier', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { json: jest.fn() };
  });

  it('should return 401 for invalid credentials', async () => {
    req.json.mockResolvedValue({ email: 'a@b.com', password: 'wrong' });
    const prisma = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.compareSync.mockReturnValue(false);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 200 and token for valid credentials', async () => {
    req.json.mockResolvedValue({ email: 'a@b.com', password: 'pass' });
    const prisma = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { generateToken } = require('@/app/api/utils/jwt');
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed', tenants: [{ id: 't1' }] });
    bcrypt.compareSync.mockReturnValue(true);
    prisma.staff.findFirst.mockResolvedValue({ id: 's1' });
    generateToken.mockReturnValue('token123');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBe('token123');
    expect(json.user).toBeDefined();
  });

  it('should return 500 on error', async () => {
    req.json.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
