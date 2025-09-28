import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  staff: { findUnique: jest.fn() },
  attendance: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({ validateTenantAuth: jest.fn() }));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));
jest.mock('@/app/api/utils/date', () => ({
  getClientCurrentDate: jest.fn(),
  getClientCurrentTime: jest.fn(),
  calculateWorkHours: jest.fn(),
}));

describe('POST /api/tenants/[tenantId]/attendances/proxy', () => {
  const tenantId = 'tenant1';
  const username = 'user1';
  const password = 'pass1';
  const staffId = 'staff1';
  const date = new Date('2025-09-28');
  const checkInTime = '08:00';
  const checkOutTime = '17:00';

  let req: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      json: jest.fn(),
      headers: {},
    };
  });

  it('should return 401 if auth fails', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    validateTenantAuth.mockReturnValue({ success: false, response: { status: 401 } });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(401);
  });

  it('should return 404 if staff not found', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff } = require('@/lib/prisma');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkin' });
    staff.findUnique.mockResolvedValue(null);
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(404);
  });

  it('should return 401 if password is invalid', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkin' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(401);
  });

  it('should return 409 if already checked in', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff, attendance } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { getClientCurrentDate } = require('@/app/api/utils/date');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkin' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    getClientCurrentDate.mockReturnValue(date);
    attendance.findUnique.mockResolvedValue({ id: 'attendance1' });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(409);
  });

  it('should check in successfully', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff, attendance } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { getClientCurrentDate, getClientCurrentTime } = require('@/app/api/utils/date');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkin' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    getClientCurrentDate.mockReturnValue(date);
    attendance.findUnique.mockResolvedValue(null);
    getClientCurrentTime.mockReturnValue(checkInTime);
    attendance.create.mockResolvedValue({ id: 'attendance1', checkInTime });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(201);
  });

  it('should return 404 if no check-in record for checkout', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff, attendance } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { getClientCurrentDate } = require('@/app/api/utils/date');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkout' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    getClientCurrentDate.mockReturnValue(date);
    attendance.findUnique.mockResolvedValue(null);
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(404);
  });

  it('should return 409 if already checked out', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff, attendance } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { getClientCurrentDate } = require('@/app/api/utils/date');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkout' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    getClientCurrentDate.mockReturnValue(date);
    attendance.findUnique.mockResolvedValue({ checkInTime, checkOutTime });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(409);
  });

  it('should checkout successfully', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff, attendance } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { getClientCurrentDate, getClientCurrentTime, calculateWorkHours } = require('@/app/api/utils/date');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'checkout' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    getClientCurrentDate.mockReturnValue(date);
    attendance.findUnique.mockResolvedValue({ checkInTime, checkOutTime: null });
    getClientCurrentTime.mockReturnValue(checkOutTime);
    calculateWorkHours.mockReturnValue(9);
    attendance.update.mockResolvedValue({ id: 'attendance1', checkOutTime, totalHours: 9 });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(200);
  });

  it('should return 400 for invalid action', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    const { staff } = require('@/lib/prisma');
    const bcrypt = require('bcryptjs');
    validateTenantAuth.mockReturnValue({ success: true });
    req.json.mockResolvedValue({ username, password, action: 'invalid' });
    staff.findUnique.mockResolvedValue({ id: staffId, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(400);
  });

  it('should return 500 on error', async () => {
    const { validateTenantAuth } = require('@/lib/auth');
    validateTenantAuth.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(500);
  });
});
