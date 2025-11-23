import { NextRequest } from 'next/server';
import { TenantServiceContainer } from '../../application/services/TenantServiceContainer';
import { TenantResponseDTO } from '../dto/TenantResponseDTO';
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantQuerySchema,
  extendTrialSchema,
  CreateTenantRequest,
  UpdateTenantRequest 
} from '../dto/TenantRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class TenantController {
  private static instance: TenantController;

  private constructor() {}

  public static getInstance(): TenantController {
    if (!TenantController.instance) {
      TenantController.instance = new TenantController();
    }
    return TenantController.instance;
  }

  async getTenants(req: NextRequest) {
    try {
      // Verify token for admin access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      // For now, any authenticated user can query tenants
      // Add role-based access control here if needed

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_name: searchParams.get('p_name') || undefined,
        p_email: searchParams.get('p_email') || undefined,
        p_user_id: searchParams.get('p_user_id') || undefined,
        p_is_subscribed: searchParams.get('p_is_subscribed') === 'true' ? true : searchParams.get('p_is_subscribed') === 'false' ? false : undefined,
        p_subscription_status: searchParams.get('p_subscription_status') || undefined,
        p_expiring_soon: searchParams.get('p_expiring_soon') ? parseInt(searchParams.get('p_expiring_soon')!) : undefined,
      };

      const validatedQuery = await tenantQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_name,
          email: validatedQuery.p_email,
          userId: validatedQuery.p_user_id,
          isSubscribed: validatedQuery.p_is_subscribed,
          subscriptionStatus: validatedQuery.p_subscription_status as any,
          expiringSoon: validatedQuery.p_expiring_soon,
        },
      };

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const result = await tenantUseCases.getTenants(options);

      return TenantResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get tenants error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async getTenantById(req: NextRequest, tenantId: string) {
    try {
      // Verify token
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenant = await tenantUseCases.getTenantById(tenantId);

      return TenantResponseDTO.mapSingleResponse(tenant);
    } catch (error: any) {
      console.error('Get tenant by ID error:', error);
      
      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      return apiResponse.internalError();
    }
  }

  async getTenantsByUserId(req: NextRequest, userId: string) {
    try {
      // Verify token and check access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      // Users can only access their own tenants unless they're admin
      if (decoded.userId !== userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot access other user\'s tenants');
      }

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenants = await tenantUseCases.getTenantsByUserId(userId);

      return TenantResponseDTO.mapArrayResponse(tenants, 'User tenants retrieved successfully');
    } catch (error: any) {
      console.error('Get tenants by user ID error:', error);
      
      if (error.message.includes('required')) {
        return apiResponse.validationError([{ field: 'userId', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async createTenant(req: NextRequest) {
    try {
      // Verify token
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (!token) {
        return apiResponse.unauthorized('Authorization token is required');
      }

      const decoded: any = verifyToken(token);
      if (!decoded) {
        return apiResponse.unauthorized('Invalid or expired token');
      }

      const body = await req.json();
      console.log('Request body:', body); // Debug log
      
      // Validate the request body
      const validatedData: CreateTenantRequest = await createTenantSchema.validate(body, { abortEarly: false });
      console.log('Validated data:', validatedData); // Debug log

      // Users can only create tenants for themselves unless they're admin
      if (decoded.userId !== validatedData.userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot create tenant for other users');
      }

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenant = await tenantUseCases.createTenant(validatedData);

      return TenantResponseDTO.mapCreatedResponse(tenant);
    } catch (error: any) {
      console.error('Create tenant error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error details:', error.errors);
      console.error('Error inner:', error.inner);
      
      if (error.name === 'ValidationError') {
        let validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && Array.isArray(error.inner) && error.inner.length > 0) {
          validationErrors = error.inner.map((err: any) => ({
            field: err.path || 'unknown',
            message: err.message || 'Validation error'
          }));
        } else if (error.message) {
          validationErrors = [{ field: 'general', message: error.message }];
        } else {
          validationErrors = [{ field: 'general', message: 'Validation failed - unknown error' }];
        }
        
        return apiResponse.validationError(validationErrors);
      }

      if (error.message && error.message.includes('already exists')) {
        return apiResponse.forbidden(error.message);
      }

      if (error.message && (error.message.includes('required') || error.message.includes('Invalid'))) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateTenant(req: NextRequest, tenantId: string) {
    try {
      // Verify token
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);

      // Check if user has access to this tenant
      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const existingTenant = await tenantUseCases.getTenantById(tenantId);
      
      if (decoded.userId !== existingTenant.userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot update other user\'s tenant');
      }

      const body = await req.json();
      const validatedData: UpdateTenantRequest = await updateTenantSchema.validate(body);

      const tenant = await tenantUseCases.updateTenant(tenantId, validatedData);

      return TenantResponseDTO.mapUpdatedResponse(tenant);
    } catch (error: any) {
      console.error('Update tenant error:', error);
      
      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists')) {
        return apiResponse.forbidden(error.message);
      }

      return apiResponse.internalError();
    }
  }

  async deleteTenant(req: NextRequest, tenantId: string) {
    try {
      // Verify token
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);

      // Check if user has access to this tenant
      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const existingTenant = await tenantUseCases.getTenantById(tenantId);
      
      if (decoded.userId !== existingTenant.userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot delete other user\'s tenant');
      }

      await tenantUseCases.deleteTenant(tenantId);

      return TenantResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete tenant error:', error);
      
      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      return apiResponse.internalError();
    }
  }

  async getActiveTenantsByUserId(req: NextRequest, userId: string) {
    try {
      // Verify token and check access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.userId !== userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot access other user\'s tenants');
      }

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenants = await tenantUseCases.getActiveTenantsByUserId(userId);

      return TenantResponseDTO.mapArrayResponse(tenants, 'Active tenants retrieved successfully');
    } catch (error: any) {
      console.error('Get active tenants error:', error);
      
      if (error.message.includes('required')) {
        return apiResponse.validationError([{ field: 'userId', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async getExpiringSoonTenants(req: NextRequest) {
    try {
      // Verify token (admin only)
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Admin access required');
      }

      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get('days') || '7');

      if (days <= 0 || days > 90) {
        return apiResponse.validationError([{ field: 'days', message: 'Days must be between 1 and 90' }]);
      }

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenants = await tenantUseCases.getExpiringSoonTenants(days);

      return TenantResponseDTO.mapArrayResponse(tenants, `Tenants expiring in ${days} days retrieved successfully`);
    } catch (error: any) {
      console.error('Get expiring tenants error:', error);
      return apiResponse.internalError();
    }
  }

  async getTenantMetrics(req: NextRequest, tenantId: string) {
    try {
      // Verify token
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);

      // Check access to tenant
      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenant = await tenantUseCases.getTenantById(tenantId);
      
      if (decoded.userId !== tenant.userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Cannot access other user\'s tenant metrics');
      }

      const metrics = await tenantUseCases.getTenantMetrics(tenantId);

      return TenantResponseDTO.mapMetricsResponse(metrics);
    } catch (error: any) {
      console.error('Get tenant metrics error:', error);
      
      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      return apiResponse.internalError();
    }
  }

  async countUserTenants(req: NextRequest, userId: string) {
    try {
      // Verify token and check access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.userId !== userId && decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied');
      }

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const count = await tenantUseCases.countUserTenants(userId);

      return TenantResponseDTO.mapCountResponse(count, 'Tenant count retrieved successfully');
    } catch (error: any) {
      console.error('Count user tenants error:', error);
      return apiResponse.internalError();
    }
  }

  async extendTrial(req: NextRequest, tenantId: string) {
    try {
      // Verify token (admin only)
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.role !== 'admin') {
        return apiResponse.forbidden('Access denied: Admin access required');
      }

      const body = await req.json();
      const validatedData = await extendTrialSchema.validate(body);

      const tenantUseCases = TenantServiceContainer.getTenantUseCases();
      const tenant = await tenantUseCases.extendTrial(tenantId, validatedData.days);

      return TenantResponseDTO.mapTrialExtendedResponse(tenant);
    } catch (error: any) {
      console.error('Extend trial error:', error);
      
      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      if (error.message.includes('not eligible')) {
        return apiResponse.validationError([{ field: 'tenantId', message: error.message }]);
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }
}