import { NextRequest } from 'next/server';
import { AttendanceUseCases } from '../../application/usecases/AttendanceUseCases';
import { PrismaAttendanceRepository } from '../../infrastructure/repositories/PrismaAttendanceRepository';
import { PrismaShiftRepository } from '../../infrastructure/repositories/PrismaShiftRepository';
import {
  CreateAttendanceData,
  UpdateAttendanceData,
  AttendanceResponse,
  AttendanceCalculationResponse,
  AttendanceSummaryResponse,
  CheckInRequest,
  CheckOutRequest,
  ShiftSuggestionResponse,
  BulkShiftAssignmentRequest,
  BulkShiftAssignmentResponse,
} from '../../application/interfaces/dto/AttendanceDto';
import { Attendance } from '../../domain/entities/Attendance';
import * as yup from 'yup';

export class AttendanceController {
  private attendanceUseCases: AttendanceUseCases;

  constructor() {
    const attendanceRepository = PrismaAttendanceRepository.getInstance();
    const shiftRepository = PrismaShiftRepository.getInstance();
    this.attendanceUseCases = new AttendanceUseCases(attendanceRepository, shiftRepository);
  }

  // Validation schemas
  private createAttendanceSchema = yup.object({
    staffId: yup.string().required('Staff ID is required'),
    date: yup.date().required('Date is required'),
    checkInTime: yup.string().optional(),
    checkOutTime: yup.string().optional(),
    isWeekend: yup.boolean().default(false),
    shiftId: yup.string().optional(), // Optional for backward compatibility
  });

  private updateAttendanceSchema = yup.object({
    date: yup.date().optional(),
    checkInTime: yup.string().optional(),
    checkOutTime: yup.string().optional(),
    isWeekend: yup.boolean().optional(),
    shiftId: yup.string().optional(), // Optional for backward compatibility
  });

  private checkInSchema = yup.object({
    checkInTime: yup.string()
      .required('Check-in time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    shiftId: yup.string().optional(),
  });

  private checkOutSchema = yup.object({
    checkOutTime: yup.string()
      .required('Check-out time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    shiftId: yup.string().optional(),
  });

  private bulkAssignmentSchema = yup.object({
    assignments: yup.array().of(
      yup.object({
        attendanceId: yup.string().required(),
        shiftId: yup.string().required(),
      })
    ).required().min(1, 'At least one assignment is required'),
  });

  // Helper methods
  private mapToResponse(attendance: Attendance): AttendanceResponse {
    return {
      id: attendance.id,
      tenantId: attendance.tenantId,
      staffId: attendance.staffId,
      date: attendance.date.toISOString().split('T')[0],
      checkInTime: attendance.checkInTime ?? undefined,
      checkOutTime: attendance.checkOutTime ?? undefined,
      isWeekend: attendance.isWeekend,
      shiftId: attendance.shiftId ?? undefined,
      createdAt: attendance.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: attendance.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private extractTenantId(request: NextRequest): string {
    // Extract from JWT token or headers - implement based on your auth system
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return tenantId;
  }

  private extractUserId(request: NextRequest): string {
    // Extract from JWT token - implement based on your auth system
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new Error('User ID is required');
    }
    return userId;
  }

  // Controller methods
  async createAttendance(request: NextRequest): Promise<{ data: AttendanceResponse }> {
    try {
      const tenantId = this.extractTenantId(request);
      const body = await request.json();
      const validatedData = await this.createAttendanceSchema.validate(body);
      
      const createData: CreateAttendanceData = {
        ...validatedData,
        tenantId,
      };

      const attendance = await this.attendanceUseCases.createAttendance(createData);
      
      return {
        data: this.mapToResponse(attendance),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create attendance');
    }
  }

  async updateAttendance(request: NextRequest, id: string): Promise<{ data: AttendanceResponse }> {
    try {
      const body = await request.json();
      const validatedData = await this.updateAttendanceSchema.validate(body);
      
      const attendance = await this.attendanceUseCases.updateAttendance(id, validatedData as UpdateAttendanceData);
      
      return {
        data: this.mapToResponse(attendance),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update attendance');
    }
  }

  async getAttendanceById(id: string): Promise<{ data: AttendanceResponse | null }> {
    try {
      const attendance = await this.attendanceUseCases.getAttendanceById(id);
      
      return {
        data: attendance ? this.mapToResponse(attendance) : null,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get attendance');
    }
  }

  async getAttendancesByStaff(
    staffId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: AttendanceResponse[] }> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const attendances = await this.attendanceUseCases.getAttendancesByStaff(staffId, start, end);
      
      return {
        data: attendances.map(this.mapToResponse),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get attendances');
    }
  }

  async getAttendancesByTenant(
    request: NextRequest,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: AttendanceResponse[] }> {
    try {
      const tenantId = this.extractTenantId(request);
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const attendances = await this.attendanceUseCases.getAttendancesByTenant(tenantId, start, end);
      
      return {
        data: attendances.map(this.mapToResponse),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get attendances');
    }
  }

  async deleteAttendance(id: string): Promise<{ message: string }> {
    try {
      await this.attendanceUseCases.deleteAttendance(id);
      
      return {
        message: 'Attendance deleted successfully',
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete attendance');
    }
  }

  async calculateWorkingHours(id: string): Promise<{ data: AttendanceCalculationResponse }> {
    try {
      const calculation = await this.attendanceUseCases.calculateWorkingHours(id);
      
      return {
        data: calculation,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to calculate working hours');
    }
  }

  async getAttendanceSummary(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: AttendanceSummaryResponse }> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const summary = await this.attendanceUseCases.getAttendanceSummary(staffId, start, end);
      
      const mappedSummary: AttendanceSummaryResponse = {
        ...summary,
        attendances: summary.attendances.map(item => ({
          ...item,
          attendance: this.mapToResponse(item.attendance),
        })),
      };
      
      return {
        data: mappedSummary,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get attendance summary');
    }
  }

  async checkIn(request: NextRequest): Promise<{ data: AttendanceResponse }> {
    try {
      const tenantId = this.extractTenantId(request);
      const userId = this.extractUserId(request);
      const body = await request.json();
      
      const validatedData = await this.checkInSchema.validate(body) as CheckInRequest;
      
      const attendance = await this.attendanceUseCases.checkIn(
        tenantId,
        userId, // Assuming userId is the staffId - adjust based on your system
        validatedData.checkInTime,
        validatedData.shiftId
      );
      
      return {
        data: this.mapToResponse(attendance),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to check in');
    }
  }

  async checkOut(request: NextRequest): Promise<{ data: AttendanceResponse }> {
    try {
      const tenantId = this.extractTenantId(request);
      const userId = this.extractUserId(request);
      const body = await request.json();
      
      const validatedData = await this.checkOutSchema.validate(body) as CheckOutRequest;
      
      const attendance = await this.attendanceUseCases.checkOut(
        tenantId,
        userId, // Assuming userId is the staffId - adjust based on your system
        validatedData.checkOutTime,
        validatedData.shiftId
      );
      
      return {
        data: this.mapToResponse(attendance),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to check out');
    }
  }

  async suggestShift(id: string): Promise<{ data: ShiftSuggestionResponse }> {
    try {
      const suggestion = await this.attendanceUseCases.suggestShiftForAttendance(id);
      
      return {
        data: suggestion,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to suggest shift');
    }
  }

  async bulkAssignShifts(request: NextRequest): Promise<{ data: BulkShiftAssignmentResponse }> {
    try {
      const body = await request.json();
      const validatedData = await this.bulkAssignmentSchema.validate(body) as BulkShiftAssignmentRequest;
      
      const result = await this.attendanceUseCases.bulkAssignShifts(validatedData.assignments);
      
      return {
        data: result,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk assign shifts');
    }
  }
}