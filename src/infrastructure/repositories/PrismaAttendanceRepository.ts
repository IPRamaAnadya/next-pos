import { Attendance } from '../../domain/entities/Attendance';
import { AttendanceRepository } from '../../application/interfaces/AttendanceRepository';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Import both interfaces to implement both
import { AttendanceRepository as OldAttendanceRepository } from '../../domain/repositories/StaffRepository';

export class PrismaAttendanceRepository implements AttendanceRepository, OldAttendanceRepository {
  private static instance: PrismaAttendanceRepository;

  private constructor() {}

  public static getInstance(): PrismaAttendanceRepository {
    if (!PrismaAttendanceRepository.instance) {
      PrismaAttendanceRepository.instance = new PrismaAttendanceRepository();
    }
    return PrismaAttendanceRepository.instance;
  }

  // Overloaded method to support both old and new interfaces
  async create(attendance: Attendance): Promise<Attendance>;
  async create(data: { tenantId: string; staffId: string; date: Date; checkInTime?: string; checkOutTime?: string; isWeekend: boolean }): Promise<Attendance>;
  async create(input: Attendance | { tenantId: string; staffId: string; date: Date; checkInTime?: string; checkOutTime?: string; isWeekend: boolean }): Promise<Attendance> {
    try {
      let createData: any;

      if (input instanceof Attendance) {
        // New interface - Attendance entity
        createData = {
          tenantId: input.tenantId,
          staffId: input.staffId,
          date: input.date,
          checkInTime: input.checkInTime,
          checkOutTime: input.checkOutTime,
          isWeekend: input.isWeekend,
          shiftId: input.shiftId, // Optional field for backward compatibility
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        };

        // Only include id if it's provided (not empty string)
        if (input.id && input.id.length > 0) {
          createData.id = input.id;
        }
      } else {
        // Old interface - plain object
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);

        createData = {
          tenantId: input.tenantId,
          staffId: input.staffId,
          date: startOfDay,
          checkInTime: input.checkInTime || null,
          checkOutTime: input.checkOutTime || null,
          isWeekend: input.isWeekend,
          totalHours: null,
        };
      }

      const data = await prisma.attendance.create({
        data: createData,
      });

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw new Error('Failed to create attendance record');
    }
  }

  // Overloaded method to support both old and new interfaces
  async findById(id: string): Promise<Attendance | null>;
  async findById(id: string, tenantId: string): Promise<Attendance | null>;
  async findById(id: string, tenantId?: string): Promise<Attendance | null> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const attendance = await prisma.attendance.findUnique({
        where: whereClause,
      });

      if (!attendance) return null;
      return this.mapToEntity(attendance);
    } catch (error) {
      console.error('Error finding attendance by ID:', error);
      throw new Error(`Failed to find attendance with ID: ${id}`);
    }
  }

  // Overloaded method to support both old (single result) and new (array result) interfaces
  async findByStaffAndDate(staffId: string, date: Date): Promise<Attendance[]>;
  async findByStaffAndDate(staffId: string, date: Date, tenantId: string): Promise<Attendance | null>;
  async findByStaffAndDate(staffId: string, date: Date, tenantId?: string): Promise<Attendance[] | Attendance | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      if (tenantId) {
        // Old interface - return single attendance or null
        const attendance = await prisma.attendance.findFirst({
          where: {
            staffId,
            tenantId,
            date: startOfDay,
          },
        });
        return attendance ? this.mapToEntity(attendance) : null;
      } else {
        // New interface - return array of attendances
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendances = await prisma.attendance.findMany({
          where: {
            staffId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return attendances.map(this.mapToEntity);
      }
    } catch (error) {
      console.error('Error finding attendance by staff and date:', error);
      throw new Error('Failed to find attendance');
    }
  }

  async findByStaff(
    staffId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    try {
      const whereClause: any = { staffId };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      } else if (startDate) {
        whereClause.date = {
          gte: startDate,
        };
      } else if (endDate) {
        whereClause.date = {
          lte: endDate,
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      });

      return attendances.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding attendance by staff:', error);
      throw new Error('Failed to retrieve attendance records');
    }
  }

  async findByTenant(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    try {
      const whereClause: any = { tenantId };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      } else if (startDate) {
        whereClause.date = {
          gte: startDate,
        };
      } else if (endDate) {
        whereClause.date = {
          lte: endDate,
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      });

      return attendances.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding attendance by tenant:', error);
      throw new Error('Failed to retrieve attendance records');
    }
  }

  async findByShift(
    shiftId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    try {
      const whereClause: any = { shiftId };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      } else if (startDate) {
        whereClause.date = {
          gte: startDate,
        };
      } else if (endDate) {
        whereClause.date = {
          lte: endDate,
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      });

      return attendances.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding attendance by shift:', error);
      throw new Error('Failed to retrieve attendance records');
    }
  }

  // Overloaded method to support both old and new interfaces
  async update(id: string, attendance: Attendance): Promise<Attendance>;
  async update(id: string, tenantId: string, updates: Partial<{ checkInTime: string; checkOutTime: string; totalHours: number }>): Promise<Attendance>;
  async update(id: string, attendanceOrTenantId: Attendance | string, updates?: Partial<{ checkInTime: string; checkOutTime: string; totalHours: number }>): Promise<Attendance> {
    try {
      let updateData: any;
      let whereClause: any = { id };

      if (attendanceOrTenantId instanceof Attendance) {
        // New interface - Attendance entity
        updateData = {
          tenantId: attendanceOrTenantId.tenantId,
          staffId: attendanceOrTenantId.staffId,
          date: attendanceOrTenantId.date,
          checkInTime: attendanceOrTenantId.checkInTime,
          checkOutTime: attendanceOrTenantId.checkOutTime,
          isWeekend: attendanceOrTenantId.isWeekend,
          shiftId: attendanceOrTenantId.shiftId,
          updatedAt: attendanceOrTenantId.updatedAt,
        };

        if (attendanceOrTenantId.totalHours !== null) {
          updateData.totalHours = attendanceOrTenantId.totalHours;
        }
      } else {
        // Old interface - tenantId and updates
        const tenantId = attendanceOrTenantId;
        whereClause.tenantId = tenantId;
        updateData = {};
        
        if (updates?.checkInTime !== undefined) updateData.checkInTime = updates.checkInTime;
        if (updates?.checkOutTime !== undefined) updateData.checkOutTime = updates.checkOutTime;
        if (updates?.totalHours !== undefined) {
          updateData.totalHours = updates.totalHours ? new Decimal(updates.totalHours) : null;
        }
      }

      const data = await prisma.attendance.update({
        where: whereClause,
        data: updateData,
      });

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw new Error('Failed to update attendance record');
    }
  }

  // Overloaded method to support both old and new interfaces
  async delete(id: string): Promise<void>;
  async delete(id: string, tenantId: string): Promise<void>;
  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      await prisma.attendance.delete({
        where: whereClause,
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw new Error('Failed to delete attendance record');
    }
  }

  // Legacy method for backward compatibility with existing StaffUseCases (single attendance)
  async findByStaffAndDateOld(staffId: string, date: Date, tenantId: string): Promise<Attendance | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.findFirst({
        where: {
          staffId,
          tenantId,
          date: startOfDay,
        },
      });

      if (!attendance) return null;
      return this.mapToEntity(attendance);
    } catch (error) {
      console.error('Error finding attendance by staff and date:', error);
      throw new Error('Failed to find attendance');
    }
  }

  // Overloaded method to support both old and new interfaces
  async findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date): Promise<Attendance[]>;
  async findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId: string): Promise<Attendance[]>;
  async findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId?: string): Promise<Attendance[]> {
    try {
      const whereClause: any = {
        staffId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const attendances = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'asc' },
      });

      return attendances.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding attendance by date range:', error);
      throw new Error('Failed to retrieve attendance records');
    }
  }

  // Legacy method for backward compatibility with existing StaffUseCases
  async findAll(tenantId: string, staffId?: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    try {
      const whereClause: any = { tenantId };
      
      if (staffId) {
        whereClause.staffId = staffId;
      }

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: [{ date: 'desc' }, { staffId: 'asc' }],
      });

      return attendances.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding all attendances:', error);
      throw new Error('Failed to retrieve attendance records');
    }
  }

  private mapToEntity(data: any): Attendance {
    return new Attendance(
      data.id,
      data.tenantId,
      data.staffId,
      data.date,
      data.checkInTime,
      data.checkOutTime,
      data.totalHours ? parseFloat(data.totalHours.toString()) : null,
      data.isWeekend,
      data.createdAt,
      data.updatedAt,
      data.shiftId // Optional field for backward compatibility
    );
  }
}