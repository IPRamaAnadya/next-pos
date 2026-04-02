import { NextRequest } from 'next/server';
import { StaffShiftServiceContainer } from '../../application/services/StaffShiftServiceContainer';
import { StaffShiftResponseDTO } from '../dto/StaffShiftResponseDTO';
import { 
  createStaffShiftSchema, 
  updateStaffShiftSchema, 
  checkInSchema,
  checkOutSchema,
  staffShiftQuerySchema,
  bulkAssignSchema,
  CreateStaffShiftRequest,
  UpdateStaffShiftRequest,
  CheckInRequest,
  CheckOutRequest,
  BulkAssignRequest
} from '../dto/StaffShiftRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class StaffShiftController {
  private static instance: StaffShiftController;

  private constructor() {}

  public static getInstance(): StaffShiftController {
    if (!StaffShiftController.instance) {
      StaffShiftController.instance = new StaffShiftController();
    }
    return StaffShiftController.instance;
  }

  async getStaffShifts(req: NextRequest, tenantId: string) {
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
        p_staff_id: searchParams.get('p_staff_id') || undefined,
        p_shift_id: searchParams.get('p_shift_id') || undefined,
        p_date: searchParams.get('p_date') ? new Date(searchParams.get('p_date')!) : undefined,
        p_date_from: searchParams.get('p_date_from') ? new Date(searchParams.get('p_date_from')!) : undefined,
        p_date_to: searchParams.get('p_date_to') ? new Date(searchParams.get('p_date_to')!) : undefined,
        p_is_completed: searchParams.get('p_is_completed') === 'true' ? true : searchParams.get('p_is_completed') === 'false' ? false : undefined,
        p_has_checked_in: searchParams.get('p_has_checked_in') === 'true' ? true : searchParams.get('p_has_checked_in') === 'false' ? false : undefined,
        p_has_checked_out: searchParams.get('p_has_checked_out') === 'true' ? true : searchParams.get('p_has_checked_out') === 'false' ? false : undefined,
      };

      const validatedQuery = await staffShiftQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          staffId: validatedQuery.p_staff_id,
          shiftId: validatedQuery.p_shift_id,
          date: validatedQuery.p_date,
          dateFrom: validatedQuery.p_date_from,
          dateTo: validatedQuery.p_date_to?.toISOString(),
          isCompleted: validatedQuery.p_is_completed,
          hasCheckedIn: validatedQuery.p_has_checked_in,
          hasCheckedOut: validatedQuery.p_has_checked_out,
        },
      };

      // Role-based filtering
      if (decoded.role === 'CASHIER' && !decoded.isOwner) {
        // Cashiers can only see their own shifts
        options.filters.staffId = decoded.staffId;
      }

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const result = await staffShiftUseCases.getStaffShifts(tenantId, options);

      return StaffShiftResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get staff shifts error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async getStaffShiftById(req: NextRequest, tenantId: string, staffShiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const staffShift = await staffShiftUseCases.getStaffShiftById(staffShiftId, tenantId);

      // Role-based access control
      if (decoded.role === 'CASHIER' && !decoded.isOwner && staffShift.staffId !== decoded.staffId) {
        return apiResponse.forbidden('Insufficient permissions to view this staff shift');
      }

      return StaffShiftResponseDTO.mapSingleResponse(staffShift);
    } catch (error: any) {
      console.error('Get staff shift by ID error:', error);
      
      if (error.message === 'Staff shift not found') {
        return apiResponse.notFound('Staff shift not found');
      }

      return apiResponse.internalError();
    }
  }

  async assignStaffToShift(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can assign shifts
      if (decoded.role !== 'owner' && decoded.role !== 'manager' && !decoded.isOwner) {
        return apiResponse.forbidden('Insufficient permissions to assign shifts');
      }

      const body = await req.json();
      const validatedData: CreateStaffShiftRequest = await createStaffShiftSchema.validate(body);

      const staffShiftData = {
        tenantId,
        staffId: validatedData.staffId,
        shiftId: validatedData.shiftId,
        date: validatedData.date,
        notes: validatedData.notes,
      };

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const staffShift = await staffShiftUseCases.assignStaffToShift(staffShiftData);

      return StaffShiftResponseDTO.mapCreatedResponse(staffShift);
    } catch (error: any) {
      console.error('Assign staff to shift error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('not found') || error.message.includes('overlapping') || error.message.includes('inactive') || error.message.includes('past dates')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateStaffShift(req: NextRequest, tenantId: string, staffShiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Get the staff shift first for access control
      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const existingStaffShift = await staffShiftUseCases.getStaffShiftById(staffShiftId, tenantId);

      // Role-based access control
      if (decoded.role === 'CASHIER' && !decoded.isOwner && existingStaffShift.staffId !== decoded.staffId) {
        return apiResponse.forbidden('Insufficient permissions to update this staff shift');
      }

      const body = await req.json();
      const validatedData: UpdateStaffShiftRequest = await updateStaffShiftSchema.validate(body);

      const updates: any = {};
      if (validatedData.check_in_time !== undefined) updates.checkInTime = validatedData.check_in_time;
      if (validatedData.check_out_time !== undefined) updates.checkOutTime = validatedData.check_out_time;
      if (validatedData.actual_break_duration !== undefined) updates.actualBreakDuration = validatedData.actual_break_duration;
      if (validatedData.late_minutes !== undefined) updates.lateMinutes = validatedData.late_minutes;
      if (validatedData.overtime_minutes !== undefined) updates.overtimeMinutes = validatedData.overtime_minutes;
      if (validatedData.is_completed !== undefined) updates.isCompleted = validatedData.is_completed;
      if (validatedData.notes !== undefined) updates.notes = validatedData.notes;

      const staffShift = await staffShiftUseCases.updateStaffShift(staffShiftId, tenantId, updates);

      return StaffShiftResponseDTO.mapUpdatedResponse(staffShift);
    } catch (error: any) {
      console.error('Update staff shift error:', error);
      
      if (error.message === 'Staff shift not found') {
        return apiResponse.notFound('Staff shift not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('Cannot') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async deleteStaffShift(req: NextRequest, tenantId: string, staffShiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can delete shifts
      if (decoded.role !== 'owner' && decoded.role !== 'manager' && !decoded.isOwner) {
        return apiResponse.forbidden('Insufficient permissions to delete staff shifts');
      }

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      await staffShiftUseCases.deleteStaffShift(staffShiftId, tenantId);

      return StaffShiftResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete staff shift error:', error);
      
      if (error.message === 'Staff shift not found') {
        return apiResponse.notFound('Staff shift not found');
      }

      if (error.message.includes('Cannot delete')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async checkInStaff(req: NextRequest, tenantId: string, staffShiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Get the staff shift first for access control
      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const existingStaffShift = await staffShiftUseCases.getStaffShiftById(staffShiftId, tenantId);

      // Role-based access control - staff can check in themselves, managers can check in anyone
      if (decoded.role === 'CASHIER' && !decoded.isOwner && existingStaffShift.staffId !== decoded.staffId) {
        return apiResponse.forbidden('Insufficient permissions to check in this staff member');
      }

      const body = await req.json();
      const validatedData: CheckInRequest = await checkInSchema.validate(body);

      const staffShift = await staffShiftUseCases.checkInStaff(staffShiftId, tenantId, validatedData.check_in_time);

      return StaffShiftResponseDTO.mapCheckInResponse(staffShift);
    } catch (error: any) {
      console.error('Check in staff error:', error);
      
      if (error.message === 'Staff shift not found') {
        return apiResponse.notFound('Staff shift not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('Cannot check in')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async checkOutStaff(req: NextRequest, tenantId: string, staffShiftId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Get the staff shift first for access control
      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const existingStaffShift = await staffShiftUseCases.getStaffShiftById(staffShiftId, tenantId);

      // Role-based access control - staff can check out themselves, managers can check out anyone
      if (decoded.role === 'CASHIER' && !decoded.isOwner && existingStaffShift.staffId !== decoded.staffId) {
        return apiResponse.forbidden('Insufficient permissions to check out this staff member');
      }

      const body = await req.json();
      const validatedData: CheckOutRequest = await checkOutSchema.validate(body);

      const staffShift = await staffShiftUseCases.checkOutStaff(
        staffShiftId, 
        tenantId, 
        validatedData.check_out_time, 
        validatedData.actual_break_duration
      );

      return StaffShiftResponseDTO.mapCheckOutResponse(staffShift);
    } catch (error: any) {
      console.error('Check out staff error:', error);
      
      if (error.message === 'Staff shift not found') {
        return apiResponse.notFound('Staff shift not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('Cannot check out')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async getStaffWorkSummary(req: NextRequest, tenantId: string, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - staff can see their own summary, managers can see anyone's
      if (decoded.role === 'CASHIER' && !decoded.isOwner && staffId !== decoded.staffId) {
        return apiResponse.forbidden('Insufficient permissions to view this staff summary');
      }

      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : new Date();

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const summary = await staffShiftUseCases.getStaffWorkSummary(staffId, startDate, endDate, tenantId);

      return StaffShiftResponseDTO.mapWorkSummaryResponse(summary);
    } catch (error: any) {
      console.error('Get staff work summary error:', error);
      return apiResponse.internalError();
    }
  }

  async bulkAssignStaffsToShifts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.unauthorized('Unauthorized: Tenant ID mismatch');
      }

      // Role-based access control - only owners and managers can bulk assign shifts
      if (decoded.role !== 'owner' && decoded.role !== 'manager' && !decoded.isOwner) {
        return apiResponse.forbidden('Insufficient permissions to bulk assign shifts');
      }

      const body = await req.json();
      const validatedData: BulkAssignRequest = await bulkAssignSchema.validate(body);

      const assignments = validatedData.assignments.map(assignment => ({
        tenantId,
        staffId: assignment.staff_id,
        shiftId: assignment.shift_id,
        date: assignment.date,
        notes: assignment.notes,
      }));

      const staffShiftUseCases = StaffShiftServiceContainer.getStaffShiftUseCases();
      const results = await staffShiftUseCases.bulkAssignStaffToShift(assignments);

      return StaffShiftResponseDTO.mapBulkAssignResponse(results);
    } catch (error: any) {
      console.error('Bulk assign staffs to shifts error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }
}