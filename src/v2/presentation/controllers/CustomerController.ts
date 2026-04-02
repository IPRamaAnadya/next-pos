import { NextRequest, NextResponse } from 'next/server';
import { CustomerServiceContainer } from '../../application/services/CustomerServiceContainer';
import { CustomerResponseDTO } from '../dto/CustomerResponseDTO';
import { 
  createCustomerSchema, 
  updateCustomerSchema, 
  customerQuerySchema,
  CreateCustomerRequest,
  UpdateCustomerRequest 
} from '../dto/CustomerRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class CustomerController {
  private static instance: CustomerController;

  private constructor() {}

  public static getInstance(): CustomerController {
    if (!CustomerController.instance) {
      CustomerController.instance = new CustomerController();
    }
    return CustomerController.instance;
  }

  async getCustomers(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('limit') || searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('page') || searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('sortBy') || searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('sortDir') || searchParams.get('p_sort_dir') || 'desc',
        p_search: searchParams.get('search') || searchParams.get('p_search') || undefined,
        p_name: searchParams.get('name') || searchParams.get('p_name') || undefined,
        p_email: searchParams.get('email') || searchParams.get('p_email') || undefined,
        p_phone: searchParams.get('phone') || searchParams.get('p_phone') || undefined,
        p_membership_code: searchParams.get('membershipCode') || searchParams.get('p_membership_code') || undefined,
        p_has_active_membership: searchParams.get('hasActiveMembership') === 'true' ? true : 
                                  searchParams.get('hasActiveMembership') === 'false' ? false :
                                  searchParams.get('p_has_active_membership') === 'true' ? true : 
                                  searchParams.get('p_has_active_membership') === 'false' ? false : undefined,
      };

      const validatedQuery = await customerQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          search: validatedQuery.p_search,
          name: validatedQuery.p_name,
          email: validatedQuery.p_email,
          phone: validatedQuery.p_phone,
          membershipCode: validatedQuery.p_membership_code,
          hasActiveMembership: validatedQuery.p_has_active_membership,
        },
      };

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      const result = await customerUseCases.getCustomers(tenantId, options);

      return CustomerResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get customers error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }
      return apiResponse.internalError();
      
    }
  }

  async getCustomerById(req: NextRequest, tenantId: string, customerId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      const customer = await customerUseCases.getCustomerById(customerId, tenantId);

      return CustomerResponseDTO.mapSingleResponse(customer);
    } catch (error: any) {
      console.error('Get customer by ID error:', error);
      
      if (error.message === 'Customer not found') {
        return apiResponse.notFound('Customer not found');
      }

      return apiResponse.internalError();
    }
  }

  async createCustomer(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: CreateCustomerRequest = await createCustomerSchema.validate(body);

      const customerData = {
        tenantId,
        membershipCode: validatedData.membership_code || undefined,
        name: validatedData.name,
        email: validatedData.email || undefined,
        phone: validatedData.phone || undefined,
        address: validatedData.address || undefined,
        birthday: validatedData.birthday || undefined,
        membershipExpiredAt: validatedData.membership_expired_at || undefined,
        points: validatedData.points || undefined,
      };

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      const customer = await customerUseCases.createCustomer(customerData);

      return CustomerResponseDTO.mapCreatedResponse(customer);
    } catch (error: any) {
      console.error('Create customer error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateCustomer(req: NextRequest, tenantId: string, customerId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: UpdateCustomerRequest = await updateCustomerSchema.validate(body);

      const updates: any = {};
      if (validatedData.membership_code !== undefined) updates.membershipCode = validatedData.membership_code;
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.email !== undefined) updates.email = validatedData.email;
      if (validatedData.phone !== undefined) updates.phone = validatedData.phone;
      if (validatedData.address !== undefined) updates.address = validatedData.address;
      if (validatedData.birthday !== undefined) updates.birthday = validatedData.birthday;
      if (validatedData.last_purchase_at !== undefined) updates.lastPurchaseAt = validatedData.last_purchase_at;
      if (validatedData.membership_expired_at !== undefined) updates.membershipExpiredAt = validatedData.membership_expired_at;
      if (validatedData.points !== undefined) updates.points = validatedData.points;

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      const customer = await customerUseCases.updateCustomer(customerId, tenantId, updates);

      return CustomerResponseDTO.mapUpdatedResponse(customer);
    } catch (error: any) {
      console.error('Update customer error:', error);
      
      if (error.message === 'Customer not found') {
        return apiResponse.notFound('Customer not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
          
      }

      if (error.message.includes('already exists')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
          
      }

      return apiResponse.internalError();
      
    }
  }

  async deleteCustomer(req: NextRequest, tenantId: string, customerId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      await customerUseCases.deleteCustomer(customerId, tenantId);

      return CustomerResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete customer error:', error);
      
      if (error.message === 'Customer not found') {
        return apiResponse.notFound('Customer not found');
      }

      return apiResponse.internalError();
    }
  }

  // Additional controller methods for customer-specific operations
  async updateCustomerPoints(req: NextRequest, tenantId: string, customerId: string) {
    try {
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const { points, action } = body;

      if (typeof points !== 'number' || points < 0) {
        return apiResponse.validationError([{ field: 'points', message: 'Points must be a non-negative number' }]);
      }

      const customerUseCases = CustomerServiceContainer.getCustomerUseCases();
      let customer;

      switch (action) {
        case 'set':
          customer = await customerUseCases.updateCustomerPoints(customerId, tenantId, points);
          break;
        case 'add':
          customer = await customerUseCases.addCustomerPoints(customerId, tenantId, points);
          break;
        case 'deduct':
          customer = await customerUseCases.deductCustomerPoints(customerId, tenantId, points);
          break;
        default:
          return apiResponse.validationError([{ field: 'action', message: 'Action must be one of: set, add, deduct' }]);
      }

      return CustomerResponseDTO.mapUpdatedResponse(customer);
    } catch (error: any) {
      console.error('Update customer points error:', error);
      
      if (error.message === 'Customer not found') {
        return apiResponse.notFound('Customer not found');
      }

      if (error.message.includes('Insufficient points') || error.message.includes('must be positive')) {
        return apiResponse.validationError([{ field: 'points', message: error.message }]);
          
      }

      return apiResponse.internalError();
    }
  }
}