import { NextRequest } from 'next/server';
import { ShiftServiceContainer } from '../../application/services/ShiftServiceContainer';
import { ShiftResponseDTO } from '../dto/ShiftResponseDTO';
import { 
  createShiftSchema, 
  updateShiftSchema, 
  shiftQuerySchema,
  toggleActiveSchema,
  CreateShiftRequest,
  UpdateShiftRequest,
  ToggleActiveRequest 
} from '../dto/ShiftRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class ShiftController {
  private static instance: ShiftController;

  private constructor() {}

  public static getInstance(): ShiftController {
    if (!ShiftController.instance) {
      ShiftController.instance = new ShiftController();
    }
    return ShiftController.instance;
  }

  async getShifts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_name: searchParams.get('p_name') || undefined,
        p_is_active: searchParams.get('p_is_active') === 'true' ? true : searchParams.get('p_is_active') === 'false' ? false : undefined,
        p_start_time: searchParams.get('p_start_time') || undefined,
        p_end_time: searchParams.get('p_end_time') || undefined,
      };

      const validatedQuery = await shiftQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_name,
          isActive: validatedQuery.p_is_active,
          startTime: validatedQuery.p_start_time,
          endTime: validatedQuery.p_end_time,
        },
      };

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const result = await shiftUseCases.getShifts(tenantId, options);

      return ShiftResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get shifts error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async getActiveShifts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shifts = await shiftUseCases.getActiveShifts(tenantId);

      return ShiftResponseDTO.mapMultipleResponse(shifts, 'Active shifts retrieved successfully');
    } catch (error: any) {
      console.error('Get active shifts error:', error);
      return apiResponse.internalError();
    }
  }

  async getShiftById(req: NextRequest, tenantId: string, shiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shift = await shiftUseCases.getShiftById(shiftId, tenantId);

      return ShiftResponseDTO.mapSingleResponse(shift);
    } catch (error: any) {
      console.error('Get shift by ID error:', error);
      
      if (error.message === 'Shift not found') {
        return apiResponse.notFound('Shift not found');
      }

      return apiResponse.internalError();
    }
  }

  async createShift(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can create shifts

      console.log('Decoded role:', decoded.role);
      console.log('Decoded isOwner:', decoded.isOwner);
      if (decoded.role !== 'owner' && decoded.role !== 'manager') {
        return apiResponse.forbidden('Insufficient permissions to create shifts');
      }

      const body = await req.json();

      console.log('Create shift request body:', body);
      let validatedData: CreateShiftRequest = body



      const shiftData = {
        tenantId,
        name: validatedData.name,
        startTime: validatedData.start_time,
        endTime: validatedData.end_time,
        isActive: true,
        calculateBeforeStartTime: validatedData.calculate_before_start_time,
        hasBreakTime: validatedData.has_break_time,
        breakDuration: validatedData.break_duration,
        minWorkingHours: validatedData.min_working_hours,
        maxWorkingHours: validatedData.max_working_hours,
        overtimeMultiplier: validatedData.overtime_multiplier,
        lateThreshold: validatedData.late_threshold,
        earlyCheckInAllowed: validatedData.early_checkin_allowed,
        color: validatedData.color,
        description: validatedData.description,
      };

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shift = await shiftUseCases.createShift(shiftData);

      return ShiftResponseDTO.mapCreatedResponse(shift);
    } catch (error: any) {
      console.error('Create shift error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists') || error.message.includes('required') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateShift(req: NextRequest, tenantId: string, shiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can update shifts
      if (decoded.role !== 'owner' && decoded.role !== 'manager' && !decoded.isOwner) {
        return apiResponse.forbidden('Insufficient permissions to update shifts');
      }

      const body = await req.json();
      const validatedData: UpdateShiftRequest = await updateShiftSchema.validate(body);

      const updates: any = {};
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.start_time !== undefined) updates.startTime = validatedData.start_time;
      if (validatedData.end_time !== undefined) updates.endTime = validatedData.end_time;
      if (validatedData.is_active !== undefined) updates.isActive = validatedData.is_active;
      if (validatedData.calculate_before_start_time !== undefined) updates.calculateBeforeStartTime = validatedData.calculate_before_start_time;
      if (validatedData.has_break_time !== undefined) updates.hasBreakTime = validatedData.has_break_time;
      if (validatedData.break_duration !== undefined) updates.breakDuration = validatedData.break_duration;
      if (validatedData.min_working_hours !== undefined) updates.minWorkingHours = validatedData.min_working_hours;
      if (validatedData.max_working_hours !== undefined) updates.maxWorkingHours = validatedData.max_working_hours;
      if (validatedData.overtime_multiplier !== undefined) updates.overtimeMultiplier = validatedData.overtime_multiplier;
      if (validatedData.late_threshold !== undefined) updates.lateThreshold = validatedData.late_threshold;
      if (validatedData.early_checkin_allowed !== undefined) updates.earlyCheckInAllowed = validatedData.early_checkin_allowed;
      if (validatedData.color !== undefined) updates.color = validatedData.color;
      if (validatedData.description !== undefined) updates.description = validatedData.description;

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shift = await shiftUseCases.updateShift(shiftId, tenantId, updates);

      return ShiftResponseDTO.mapUpdatedResponse(shift);
    } catch (error: any) {
      console.error('Update shift error:', error);
      
      if (error.message === 'Shift not found') {
        return apiResponse.notFound('Shift not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async deleteShift(req: NextRequest, tenantId: string, shiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners can delete shifts
      if (decoded.role !== 'owner') {
        return apiResponse.forbidden('Insufficient permissions to delete shifts');
      }

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      await shiftUseCases.deleteShift(shiftId, tenantId);

      return ShiftResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete shift error:', error);
      
      if (error.message === 'Shift not found') {
        return apiResponse.notFound('Shift not found');
      }

      return apiResponse.internalError();
    }
  }

  async toggleShiftActive(req: NextRequest, tenantId: string, shiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can toggle active status
      if (decoded.role !== 'owner' && decoded.role !== 'MANAGER' && !decoded.isOwner) {
        return apiResponse.forbidden('Insufficient permissions to modify shift status');
      }

      const body = await req.json();
      const validatedData: ToggleActiveRequest = await toggleActiveSchema.validate(body);

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shift = await shiftUseCases.toggleShiftActive(shiftId, tenantId, validatedData.is_active);

      return ShiftResponseDTO.mapActiveToggleResponse(shift);
    } catch (error: any) {
      console.error('Toggle shift active error:', error);
      
      if (error.message === 'Shift not found') {
        return apiResponse.notFound('Shift not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async createDefaultShifts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners can create default shifts
      if (!decoded.isOwner && decoded.role !== 'owner') {
        return apiResponse.forbidden('Insufficient permissions to create default shifts');
      }

      const shiftUseCases = ShiftServiceContainer.getShiftUseCases();
      const shifts = await shiftUseCases.createDefaultShifts(tenantId);

      return ShiftResponseDTO.mapMultipleResponse(shifts, 'Default shifts created successfully');
    } catch (error: any) {
      console.error('Create default shifts error:', error);
      return apiResponse.internalError();
    }
  }
}