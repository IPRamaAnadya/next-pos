import { StaffShift } from '../../domain/entities/StaffShift';
import { IStaffShiftRepository, PaginatedStaffShifts, StaffShiftQueryOptions, StaffShiftCreateData } from '../../domain/repositories/IStaffShiftRepository';
import prisma from '@/lib/prisma';

export class PrismaStaffShiftRepository implements IStaffShiftRepository {
  private static instance: PrismaStaffShiftRepository;

  private constructor() {}

  public static getInstance(): PrismaStaffShiftRepository {
    if (!PrismaStaffShiftRepository.instance) {
      PrismaStaffShiftRepository.instance = new PrismaStaffShiftRepository();
    }
    return PrismaStaffShiftRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'staff_id': 'staffId',
    'shift_id': 'shiftId',
    'check_in_time': 'checkInTime',
    'check_out_time': 'checkOutTime',
    'actual_break_duration': 'actualBreakDuration',
    'total_worked_minutes': 'totalWorkedMinutes',
    'late_minutes': 'lateMinutes',
    'overtime_minutes': 'overtimeMinutes',
    'is_completed': 'isCompleted',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'staffId', 'shiftId', 'date', 'checkInTime', 'checkOutTime',
    'totalWorkedMinutes', 'lateMinutes', 'overtimeMinutes', 'isCompleted', 'createdAt', 'updatedAt'
  ]);

  private mapSortField(apiFieldName: string): string {
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<StaffShift | null> {
    try {
      const staffShift = await prisma.staffShift.findUnique({
        where: { id, tenantId },
      });

      if (!staffShift) return null;
      return this.mapToEntity(staffShift);
    } catch (error) {
      console.error('Error finding staff shift by ID:', error);
      throw new Error(`Failed to find staff shift with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: StaffShiftQueryOptions): Promise<PaginatedStaffShifts> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.staffId) {
        whereClause.staffId = filters.staffId;
      }
      if (filters?.shiftId) {
        whereClause.shiftId = filters.shiftId;
      }
      if (filters?.date) {
        whereClause.date = filters.date;
      }
      if (filters?.dateFrom && filters?.dateTo) {
        whereClause.date = {
          gte: filters.dateFrom,
          lte: new Date(filters.dateTo)
        };
      }
      if (filters?.isCompleted !== undefined) {
        whereClause.isCompleted = filters.isCompleted;
      }
      if (filters?.hasCheckedIn !== undefined) {
        if (filters.hasCheckedIn) {
          whereClause.checkInTime = { not: null };
        } else {
          whereClause.checkInTime = null;
        }
      }
      if (filters?.hasCheckedOut !== undefined) {
        if (filters.hasCheckedOut) {
          whereClause.checkOutTime = { not: null };
        } else {
          whereClause.checkOutTime = null;
        }
      }

      const totalCount = await prisma.staffShift.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      const mappedSortField = this.mapSortField(sortBy);
      
      const staffShifts = await prisma.staffShift.findMany({
        where: whereClause,
        include: { shift: true, staff: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      console.log('Retrieved staff shifts:', staffShifts);

      return {
        data: staffShifts.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding staff shifts:', error);
      throw new Error('Failed to retrieve staff shifts');
    }
  }

  async findByStaffAndDate(staffId: string, date: Date, tenantId: string): Promise<StaffShift[]> {
    try {
      const staffShifts = await prisma.staffShift.findMany({
        where: { 
          staffId,
          date,
          tenantId 
        },
        orderBy: { createdAt: 'asc' }
      });

      return staffShifts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding staff shifts by staff and date:', error);
      throw new Error('Failed to retrieve staff shifts for the specified date');
    }
  }

  async findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId: string): Promise<StaffShift[]> {
    try {
      const staffShifts = await prisma.staffShift.findMany({
        where: { 
          staffId,
          tenantId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      return staffShifts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding staff shifts by date range:', error);
      throw new Error('Failed to retrieve staff shifts for the specified date range');
    }
  }

  async findActiveByStaff(staffId: string, tenantId: string): Promise<StaffShift[]> {
    try {
      const staffShifts = await prisma.staffShift.findMany({
        where: { 
          staffId,
          tenantId,
          checkInTime: { not: null },
          checkOutTime: null
        },
        orderBy: { checkInTime: 'desc' }
      });

      return staffShifts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding active staff shifts:', error);
      throw new Error('Failed to retrieve active staff shifts');
    }
  }

  async findByShift(shiftId: string, tenantId: string, options: StaffShiftQueryOptions): Promise<PaginatedStaffShifts> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { 
        shiftId,
        tenantId 
      };
      
      // Apply additional filters
      if (filters?.staffId) {
        whereClause.staffId = filters.staffId;
      }
      if (filters?.date) {
        whereClause.date = filters.date;
      }
      if (filters?.dateFrom && filters?.dateTo) {
        whereClause.date = {
          gte: filters.dateFrom,
          lte: new Date(filters.dateTo)
        };
      }

      const totalCount = await prisma.staffShift.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      const mappedSortField = this.mapSortField(sortBy);
      
      const staffShifts = await prisma.staffShift.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: staffShifts.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding staff shifts by shift:', error);
      throw new Error('Failed to retrieve staff shifts for the specified shift');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, tenantId: string, options?: Partial<StaffShiftQueryOptions>): Promise<StaffShift[]> {
    try {
      const whereClause: any = { 
        tenantId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      // Apply filters if provided
      if (options?.filters?.staffId) {
        whereClause.staffId = options.filters.staffId;
      }
      if (options?.filters?.shiftId) {
        whereClause.shiftId = options.filters.shiftId;
      }

      const staffShifts = await prisma.staffShift.findMany({
        where: whereClause,
        orderBy: { date: 'asc' }
      });

      return staffShifts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding staff shifts by date range:', error);
      throw new Error('Failed to retrieve staff shifts for the specified date range');
    }
  }

  async create(data: StaffShiftCreateData): Promise<StaffShift> {
    try {
      const staffShift = await prisma.staffShift.create({
        data: {
          tenantId: data.tenantId,
          staffId: data.staffId,
          shiftId: data.shiftId,
          date: data.date,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          actualBreakDuration: data.actualBreakDuration,
          totalWorkedMinutes: data.totalWorkedMinutes,
          lateMinutes: data.lateMinutes ?? 0,
          overtimeMinutes: data.overtimeMinutes ?? 0,
          isCompleted: data.isCompleted ?? false,
          notes: data.notes,
        },
      });
      return this.mapToEntity(staffShift);
    } catch (error) {
      console.error('Error creating staff shift:', error);
      throw new Error('Failed to create staff shift');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<StaffShift>): Promise<StaffShift> {
    try {
      const staffShift = await prisma.staffShift.update({
        where: { id, tenantId },
        data: {
          ...(updates.checkInTime !== undefined && { checkInTime: updates.checkInTime }),
          ...(updates.checkOutTime !== undefined && { checkOutTime: updates.checkOutTime }),
          ...(updates.actualBreakDuration !== undefined && { actualBreakDuration: updates.actualBreakDuration }),
          ...(updates.totalWorkedMinutes !== undefined && { totalWorkedMinutes: updates.totalWorkedMinutes }),
          ...(updates.lateMinutes !== undefined && { lateMinutes: updates.lateMinutes }),
          ...(updates.overtimeMinutes !== undefined && { overtimeMinutes: updates.overtimeMinutes }),
          ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
        },
      });
      return this.mapToEntity(staffShift);
    } catch (error) {
      console.error('Error updating staff shift:', error);
      throw new Error('Failed to update staff shift');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.staffShift.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting staff shift:', error);
      throw new Error('Failed to delete staff shift');
    }
  }

  async checkIn(id: string, tenantId: string, checkInTime: string): Promise<StaffShift> {
    try {
      const staffShift = await prisma.staffShift.update({
        where: { id, tenantId },
        data: { checkInTime },
      });
      return this.mapToEntity(staffShift);
    } catch (error) {
      console.error('Error checking in staff shift:', error);
      throw new Error('Failed to check in staff shift');
    }
  }

  async checkOut(id: string, tenantId: string, checkOutTime: string, actualBreakDuration?: number): Promise<StaffShift> {
    try {
      const staffShift = await prisma.staffShift.update({
        where: { id, tenantId },
        data: { 
          checkOutTime,
          ...(actualBreakDuration !== undefined && { actualBreakDuration })
        },
      });
      return this.mapToEntity(staffShift);
    } catch (error) {
      console.error('Error checking out staff shift:', error);
      throw new Error('Failed to check out staff shift');
    }
  }

  private mapToEntity(data: any): StaffShift {
    return new StaffShift(
      data.id,
      data.tenantId,
      data.staffId,
      data.shiftId,
      data.date,
      data.checkInTime,
      data.checkOutTime,
      data.actualBreakDuration,
      data.totalWorkedMinutes,
      data.lateMinutes,
      data.overtimeMinutes,
      data.isCompleted,
      data.notes,
      data.createdAt,
      data.updatedAt,
      data.shift,
      data.staff
    );
  }
}