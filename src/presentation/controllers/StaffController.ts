import { NextRequest } from 'next/server';
import { 
  createStaffSchema, 
  updateStaffSchema, 
  staffQuerySchema, 
  createSalarySchema, 
  updateSalarySchema,
  checkInSchema,
  checkOutSchema,
  attendanceQuerySchema
} from '../dto/StaffRequestDTO';
import { StaffMapper } from '../mappers/StaffMapper';
import { StaffServiceContainer } from '../../application/services/StaffServiceContainer';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';
import { ValidationError } from 'yup';

export class StaffController {
  private static instance: StaffController;

  private constructor() {}

  public static getInstance(): StaffController {
    if (!StaffController.instance) {
      StaffController.instance = new StaffController();
    }
    return StaffController.instance;
  }

  async create(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId } = decoded;
      
      // Check permissions - only owners and managers can create staff
      if (role === 'CASHIER') {
        return apiResponse.forbidden('Cashiers cannot create staff');
      }

      const body = await req.json();
      const validatedData = await createStaffSchema.validate(body, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const staff = await staffUseCases.createStaff({
        tenantId,
        username: validatedData.username,
        password: validatedData.password,
        role: validatedData.role,
        isOwner: validatedData.is_owner,
      });

      const response = StaffMapper.toStaffResponseDTO(staff);
      return apiResponse.success({ data: response, message: 'Staff created successfully' });
    } catch (error: any) {
      console.error('Error creating staff:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('Username') && error.message?.includes('already exists')) {
        return apiResponse.success({ data: null, message: 'Username already exists for this tenant' });
      }

      return apiResponse.internalError();
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId } = decoded;

      const body = await req.json();

      const validatedData = await updateStaffSchema.validate(body, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const staff = await staffUseCases.updateStaff(
        id,
        tenantId,
        validatedData,
        staffId,
        role,
        role == 'owner' || false
      );

      const response = StaffMapper.toStaffResponseDTO(staff);
      return apiResponse.success({ data: response, message: 'Staff updated successfully' });
    } catch (error: any) {
      console.error('Error updating staff:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Staff not found');
      }

      if (error.message?.includes('Access denied')) {
        return apiResponse.forbidden(error.message);
      }

      if (error.message?.includes('Username') && error.message?.includes('already exists')) {
        return apiResponse.success({ data: null, message: 'Username already exists for this tenant' });
      }

      return apiResponse.internalError();
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      await staffUseCases.deleteStaff(id, tenantId, role, role == 'owner' || false);

      const response = StaffMapper.toDeleteResponseDTO(true, 'Staff deleted successfully');
      return apiResponse.success({ data: response, message: 'Staff deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting staff:', error);

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Staff not found');
      }

      if (error.message?.includes('Access denied')) {
        return apiResponse.forbidden(error.message);
      }

      if (error.message?.includes('Cannot delete')) {
        return apiResponse.success({ data: null, message: error.message });
      }

      return apiResponse.internalError();
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId } = decoded;
      

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const staff = await staffUseCases.getStaffById(id, tenantId, staffId, role, role == 'owner' || false);

      const response = StaffMapper.toStaffResponseDTO(staff);
      return apiResponse.success({ data: response, message: 'Staff retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting staff by id:', error);

      if (error.message?.includes('not found') || error.message?.includes('Access denied')) {
        return apiResponse.notFound('Staff not found');
      }

      return apiResponse.internalError();
    }
  }

  async getAll(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId } = decoded;
      console.log(`[StaffController] Decoded token:`, {
        userId,
        tenantId,
        role,
        staffId,
        isOwner: decoded.isOwner
      });

      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      const queryParams = {
        p_limit: searchParams.get('p_limit') ? parseInt(searchParams.get('p_limit')!) : 10,
        p_page: searchParams.get('p_page') ? parseInt(searchParams.get('p_page')!) : 1,
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_search: searchParams.get('p_search') || undefined,
        p_role: searchParams.get('p_role') || undefined,
        p_is_owner: searchParams.get('p_is_owner') === 'true' ? true : 
                   searchParams.get('p_is_owner') === 'false' ? false : undefined,
        p_include_owner: searchParams.get('p_include_owner') === 'false' ? false : true,
      };

      const validatedData = await staffQuerySchema.validate(queryParams, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const result = await staffUseCases.getStaffs(tenantId, {
        limit: validatedData.p_limit,
        page: validatedData.p_page,
        sortBy: validatedData.p_sort_by,
        sortDir: validatedData.p_sort_dir,
        search: validatedData.p_search,
        role: validatedData.p_role,
        isOwner: validatedData.p_is_owner,
        includeOwner: validatedData.p_include_owner,
      }, role, decoded.isOwner || false, staffId);

      console.log(`[StaffController] After getStaffs:`, {
        dataCount: result.data.length,
        total: result.pagination.total,
        page: validatedData.p_page,
        limit: validatedData.p_limit,
        staffData: result.data.map(s => ({ id: s.id, role: s.role, username: s.username }))
      });

      const response = StaffMapper.toStaffListResponseDTO(
        result.data,
        result.pagination.total,
        validatedData.p_page,
        validatedData.p_limit
      );

      console.log(`[StaffController] After mapping:`, {
        responseDataCount: response.data.length,
        responseTotal: response.total
      });

      return apiResponse.success({ 
        data: response.data, 
        message: 'Staffs retrieved successfully',
        pagination: {
          page: response.page,
          pageSize: response.limit,
          total: response.total
        }
      });
    } catch (error: any) {
      console.error('Error getting staffs:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      return apiResponse.internalError();
    }
  }

  // Salary Management
  async getStaffSalary(req: NextRequest, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId: requesterStaffId } = decoded;

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const salary = await staffUseCases.getStaffSalary(staffId, tenantId, requesterStaffId, role, decoded.isOwner || false);

      const response = StaffMapper.toSalaryResponseDTO(salary);
      return apiResponse.success({ data: response, message: 'Staff salary retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting staff salary:', error);

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Staff salary not found');
      }

      if (error.message?.includes('Access denied')) {
        return apiResponse.forbidden(error.message);
      }

      return apiResponse.internalError();
    }
  }

  async createOrUpdateStaffSalary(req: NextRequest, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      const body = await req.json();
      const validatedData = await createSalarySchema.validate(body, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const salary = await staffUseCases.createOrUpdateStaffSalary(
        staffId,
        tenantId,
        {
          basicSalary: validatedData.basic_salary,
          fixedAllowance: validatedData.fixed_allowance,
          type: validatedData.type,
        },
        role,
        decoded.isOwner || false
      );

      const response = StaffMapper.toSalaryResponseDTO(salary);
      return apiResponse.success({ data: response, message: 'Staff salary saved successfully' });
    } catch (error: any) {
      console.error('Error creating/updating staff salary:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Staff not found');
      }

      if (error.message?.includes('Access denied')) {
        return apiResponse.forbidden(error.message);
      }

      return apiResponse.internalError();
    }
  }

  // Attendance Management
  async checkIn(req: NextRequest, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId } = decoded;

      const body = await req.json();
      const validatedData = await checkInSchema.validate(body, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const attendance = await staffUseCases.checkIn(
        staffId,
        tenantId,
        validatedData.check_in_time,
        validatedData.date
      );

      const response = StaffMapper.toAttendanceResponseDTO(attendance);
      return apiResponse.success({ data: response, message: 'Check-in successful' });
    } catch (error: any) {
      console.error('Error checking in:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('Already checked in')) {
        return apiResponse.success({ data: null, message: error.message });
      }

      return apiResponse.internalError();
    }
  }

  async checkOut(req: NextRequest, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId } = decoded;

      const body = await req.json();
      const validatedData = await checkOutSchema.validate(body, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const attendance = await staffUseCases.checkOut(
        staffId,
        tenantId,
        validatedData.check_out_time,
        validatedData.date
      );

      const response = StaffMapper.toAttendanceResponseDTO(attendance);
      return apiResponse.success({ data: response, message: 'Check-out successful' });
    } catch (error: any) {
      console.error('Error checking out:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('No check-in') || error.message?.includes('Must check in') || error.message?.includes('Already checked out')) {
        return apiResponse.success({ data: null, message: error.message });
      }

      return apiResponse.internalError();
    }
  }

  async getStaffAttendance(req: NextRequest, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role, staffId: requesterStaffId } = decoded;

      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      const queryParams = {
        start_date: searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined,
        end_date: searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined,
        staff_id: staffId,
      };

      const validatedData = await attendanceQuerySchema.validate(queryParams, { abortEarly: false });

      const staffUseCases = StaffServiceContainer.getStaffUseCases();
      const attendances = await staffUseCases.getStaffAttendance(
        staffId,
        tenantId,
        validatedData.start_date,
        validatedData.end_date,
        requesterStaffId,
        role,
        decoded.isOwner || false
      );

      const response = attendances.map(attendance => StaffMapper.toAttendanceResponseDTO(attendance));
      return apiResponse.success({ data: response, message: 'Staff attendance retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting staff attendance:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('Access denied')) {
        return apiResponse.forbidden(error.message);
      }

      return apiResponse.internalError();
    }
  }
}