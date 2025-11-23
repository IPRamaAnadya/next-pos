import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/app/api/utils/jwt');
jest.mock('@/lib/subscriptionLimit');
jest.mock('@/lib/orderNotificationService');

// Import cleanup services for proper test cleanup
import { OrderServiceContainer } from '../../../../../../infrastructure/container/OrderServiceContainer';
import { OrderPerformanceMonitor } from '../../../../../../infrastructure/monitoring/OrderPerformanceMonitor';

const mockToken = 'mock-jwt-token';
const mockTenantId = 'tenant-123';
const mockStaffId = 'staff-123';

const mockDecodedToken = {
  tenantId: mockTenantId,
  staffId: mockStaffId
};

describe('Orders API v2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock JWT verification
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockReturnValue(mockDecodedToken);
  });

  afterEach(() => {
    // Clean up after each test to prevent memory leaks
    OrderServiceContainer.cleanup();
    OrderPerformanceMonitor.clearMetrics();
  });

  describe('GET /api/v2/tenants/[tenantId]/orders', () => {
    it('should return orders with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/tenants/tenant-123/orders?p_limit=10&p_page=1', {
        headers: {
          'authorization': `Bearer ${mockToken}`
        }
      });

      const params = { tenantId: mockTenantId };
      const response = await GET(request, { params });
      
      expect(response.status).toBe(200);
    });

    it('should return 401 when token is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/tenants/tenant-123/orders');
      const params = { tenantId: mockTenantId };
      
      const response = await GET(request, { params });
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v2/tenants/[tenantId]/orders', () => {
    const mockOrderData = {
      customerName: 'John Doe',
      subtotal: 100000,
      totalAmount: 110000,
      grandTotal: 110000,
      paidAmount: 110000,
      change: 0,
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: mockStaffId,
      orderItems: [
        {
          productId: 'product-123',
          productName: 'Test Product',
          productPrice: 50000,
          qty: 2
        }
      ]
    };

    it('should create order successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/tenants/tenant-123/orders', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${mockToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockOrderData)
      });

      const params = { tenantId: mockTenantId };
      const response = await POST(request, { params });
      
      expect(response.status).toBe(200);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        // Missing required fields
        subtotal: 'invalid'
      };

      const request = new NextRequest('http://localhost:3000/api/v2/tenants/tenant-123/orders', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${mockToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const params = { tenantId: mockTenantId };
      const response = await POST(request, { params });
      
      expect(response.status).toBe(400);
    });
  });
});