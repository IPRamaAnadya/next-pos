jest.mock('@/lib/prisma', () => ({
  customer: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({ validateTenantAuth: jest.fn() }));
jest.mock('@/app/api/utils/jwt', () => ({ verifyToken: jest.fn() }));
jest.mock('@/utils/validation/customerSchema', () => ({ customerCreateSchema: { validate: jest.fn() } }));

describe('/api/tenants/[tenantId]/customers', () => {
  const tenantId = 'tenant1';
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { url: 'http://localhost', headers: { get: jest.fn() }, json: jest.fn() };
  });

  describe('GET', () => {
    it('should return 401 if auth fails', async () => {
      const { validateTenantAuth } = require('@/lib/auth');
      validateTenantAuth.mockReturnValue({ success: false, response: { status: 401 } });
      const res = await GET(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(401);
    });
    it('should return customers and pagination', async () => {
      const { validateTenantAuth } = require('@/lib/auth');
      const prisma = require('@/lib/prisma');
      validateTenantAuth.mockReturnValue({ success: true, tenantId });
      prisma.customer.count.mockResolvedValue(2);
      prisma.customer.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      req.url = 'http://localhost?p_limit=2&p_page=1';
      const res = await GET(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.customers.length).toBe(2);
      expect(json.data.pagination.total_data).toBe(2);
    });
    it('should return 500 on error', async () => {
      const { validateTenantAuth } = require('@/lib/auth');
      validateTenantAuth.mockImplementation(() => { throw new Error('fail'); });
      const res = await GET(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should return 403 if tenantId mismatch', async () => {
      const { verifyToken } = require('@/app/api/utils/jwt');
      req.headers.get.mockReturnValue('Bearer token');
      verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
      req.json.mockResolvedValue({});
      const res = await POST(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(403);
    });
    it('should return 400 if validation fails', async () => {
      const { verifyToken } = require('@/app/api/utils/jwt');
      const { customerCreateSchema } = require('@/utils/validation/customerSchema');
      req.headers.get.mockReturnValue('Bearer token');
      verifyToken.mockReturnValue({ tenantId });
      req.json.mockResolvedValue({ name: '' });
      customerCreateSchema.validate.mockRejectedValue({ errors: ['Name required'] });
      const res = await POST(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(400);
    });
    it('should create customer and return 201', async () => {
      const { verifyToken } = require('@/app/api/utils/jwt');
      const { customerCreateSchema } = require('@/utils/validation/customerSchema');
      const prisma = require('@/lib/prisma');
      req.headers.get.mockReturnValue('Bearer token');
      verifyToken.mockReturnValue({ tenantId });
      req.json.mockResolvedValue({ name: 'John' });
      customerCreateSchema.validate.mockResolvedValue(true);
      prisma.customer.create.mockResolvedValue({ id: 'c1', name: 'John' });
      const res = await POST(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.name).toBe('John');
    });
    it('should return 500 on error', async () => {
      const { verifyToken } = require('@/app/api/utils/jwt');
      req.headers.get.mockReturnValue('Bearer token');
      verifyToken.mockImplementation(() => { throw new Error('fail'); });
      req.json.mockResolvedValue({});
      const res = await POST(req, { params: Promise.resolve({ tenantId }) });
      expect(res.status).toBe(500);
    });
  });
});
// Test template for customers API
import { GET, POST } from './route';
describe('/api/tenants/[tenantId]/customers', () => {
  it('should GET customers (mock)', async () => {
    // TODO: mock prisma and test GET
  });
  it('should POST customer (mock)', async () => {
    // TODO: mock prisma and test POST
  });
});
