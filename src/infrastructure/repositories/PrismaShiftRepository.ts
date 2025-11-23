import { Shift } from '../../domain/entities/Shift';
import { IShiftRepository, PaginatedShifts, ShiftQueryOptions, ShiftCreateData } from '../../domain/repositories/IShiftRepository';
import { ShiftRepository } from '../../application/interfaces/ShiftRepository';
import prisma from '@/lib/prisma';

export class PrismaShiftRepository implements IShiftRepository, ShiftRepository {
  private static instance: PrismaShiftRepository;

  private constructor() {}

  public static getInstance(): PrismaShiftRepository {
    if (!PrismaShiftRepository.instance) {
      PrismaShiftRepository.instance = new PrismaShiftRepository();
    }
    return PrismaShiftRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'start_time': 'startTime',
    'end_time': 'endTime',
    'is_active': 'isActive',
    'calculate_before_start_time': 'calculateBeforeStartTime',
    'has_break_time': 'hasBreakTime',
    'break_duration': 'breakDuration',
    'min_working_hours': 'minWorkingHours',
    'max_working_hours': 'maxWorkingHours',
    'overtime_multiplier': 'overtimeMultiplier',
    'late_threshold': 'lateThreshold',
    'early_checkin_allowed': 'earlyCheckInAllowed',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'name', 'startTime', 'endTime', 'isActive', 
    'minWorkingHours', 'maxWorkingHours', 'createdAt', 'updatedAt'
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

  // Method overloading for interface compatibility
  async findById(id: string): Promise<Shift | null>;
  async findById(id: string, tenantId: string): Promise<Shift | null>;
  async findById(id: string, tenantId?: string): Promise<Shift | null> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }
      
      const shift = await prisma.shift.findUnique({
        where: whereClause,
      });

      if (!shift) return null;
      return this.mapToEntity(shift);
    } catch (error) {
      console.error('Error finding shift by ID:', error);
      throw new Error(`Failed to find shift with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: ShiftQueryOptions): Promise<PaginatedShifts> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters?.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      if (filters?.startTime) {
        whereClause.startTime = filters.startTime;
      }
      if (filters?.endTime) {
        whereClause.endTime = filters.endTime;
      }

      const totalCount = await prisma.shift.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      const mappedSortField = this.mapSortField(sortBy);
      
      const shifts = await prisma.shift.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: shifts.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding shifts:', error);
      throw new Error('Failed to retrieve shifts');
    }
  }

  async findActiveShifts(tenantId: string): Promise<Shift[]> {
    try {
      const shifts = await prisma.shift.findMany({
        where: { 
          tenantId,
          isActive: true 
        },
        orderBy: { startTime: 'asc' }
      });

      return shifts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding active shifts:', error);
      throw new Error('Failed to retrieve active shifts');
    }
  }

  async findByName(name: string, tenantId: string): Promise<Shift | null> {
    try {
      const shift = await prisma.shift.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          tenantId 
        },
      });

      if (!shift) return null;
      return this.mapToEntity(shift);
    } catch (error) {
      console.error('Error finding shift by name:', error);
      throw new Error(`Failed to find shift with name: ${name}`);
    }
  }

  async findByTenant(tenantId: string, activeOnly: boolean = false): Promise<Shift[]> {
    try {
      const whereClause: any = { tenantId };
      if (activeOnly) {
        whereClause.isActive = true;
      }

      const shifts = await prisma.shift.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return shifts.map(shift => this.mapToEntity(shift));
    } catch (error) {
      console.error('Error finding shifts by tenant:', error);
      throw new Error(`Failed to find shifts for tenant: ${tenantId}`);
    }
  }

  // Method overloading for interface compatibility
  async create(shift: Shift): Promise<Shift>;
  async create(data: ShiftCreateData): Promise<Shift>;
  async create(shiftOrData: Shift | ShiftCreateData): Promise<Shift> {
    try {
      let createData: any;

      if ('tenantId' in shiftOrData && typeof shiftOrData.tenantId === 'string') {
        // It's ShiftCreateData (has tenantId as string property)
        const data = shiftOrData as ShiftCreateData;
        createData = {
          tenantId: data.tenantId,
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          isActive: data.isActive,
          calculateBeforeStartTime: data.calculateBeforeStartTime,
          hasBreakTime: data.hasBreakTime,
          breakDuration: data.breakDuration,
          minWorkingHours: data.minWorkingHours,
          maxWorkingHours: data.maxWorkingHours,
          overtimeMultiplier: data.overtimeMultiplier,
          lateThreshold: data.lateThreshold,
          earlyCheckInAllowed: data.earlyCheckInAllowed,
          color: data.color,
          description: data.description,
        };
      } else {
        // It's Shift entity
        const shift = shiftOrData as Shift;
        createData = {
          tenantId: shift.tenantId,
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: shift.isActive,
          calculateBeforeStartTime: shift.calculateBeforeStartTime,
          hasBreakTime: shift.hasBreakTime,
          breakDuration: shift.breakDuration,
          minWorkingHours: shift.minWorkingHours,
          maxWorkingHours: shift.maxWorkingHours,
          overtimeMultiplier: shift.overtimeMultiplier,
          lateThreshold: shift.lateThreshold,
          earlyCheckInAllowed: shift.earlyCheckInAllowed,
          color: shift.color,
          description: shift.description,
        };
      }

      const createdShift = await prisma.shift.create({
        data: createData,
      });
      return this.mapToEntity(createdShift);
    } catch (error) {
      console.error('Error creating shift:', error);
      throw new Error('Failed to create shift');
    }
  }

  // Method overloading for interface compatibility
  async update(id: string, shift: Shift): Promise<Shift>;
  async update(id: string, tenantId: string, updates: Partial<Shift>): Promise<Shift>;
  async update(id: string, shiftOrTenantId: Shift | string, updates?: Partial<Shift>): Promise<Shift> {
    try {
      let whereClause: any;
      let updateData: any;

      if (typeof shiftOrTenantId === 'string') {
        // Called as update(id, tenantId, updates)
        const tenantId = shiftOrTenantId;
        whereClause = { id, tenantId };
        updateData = {
          ...(updates?.name && { name: updates.name }),
          ...(updates?.startTime && { startTime: updates.startTime }),
          ...(updates?.endTime && { endTime: updates.endTime }),
          ...(updates?.isActive !== undefined && { isActive: updates.isActive }),
          ...(updates?.calculateBeforeStartTime !== undefined && { calculateBeforeStartTime: updates.calculateBeforeStartTime }),
          ...(updates?.hasBreakTime !== undefined && { hasBreakTime: updates.hasBreakTime }),
          ...(updates?.breakDuration !== undefined && { breakDuration: updates.breakDuration }),
          ...(updates?.minWorkingHours !== undefined && { minWorkingHours: updates.minWorkingHours }),
          ...(updates?.maxWorkingHours !== undefined && { maxWorkingHours: updates.maxWorkingHours }),
          ...(updates?.overtimeMultiplier !== undefined && { overtimeMultiplier: updates.overtimeMultiplier }),
          ...(updates?.lateThreshold !== undefined && { lateThreshold: updates.lateThreshold }),
          ...(updates?.earlyCheckInAllowed !== undefined && { earlyCheckInAllowed: updates.earlyCheckInAllowed }),
          ...(updates?.color && { color: updates.color }),
          ...(updates?.description !== undefined && { description: updates.description }),
        };
      } else {
        // Called as update(id, shift)
        const shift = shiftOrTenantId;
        whereClause = { id };
        updateData = {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: shift.isActive,
          calculateBeforeStartTime: shift.calculateBeforeStartTime,
          hasBreakTime: shift.hasBreakTime,
          breakDuration: shift.breakDuration,
          minWorkingHours: shift.minWorkingHours,
          maxWorkingHours: shift.maxWorkingHours,
          overtimeMultiplier: shift.overtimeMultiplier,
          lateThreshold: shift.lateThreshold,
          earlyCheckInAllowed: shift.earlyCheckInAllowed,
          color: shift.color,
          description: shift.description,
        };
      }

      const updatedShift = await prisma.shift.update({
        where: whereClause,
        data: updateData,
      });
      return this.mapToEntity(updatedShift);
    } catch (error) {
      console.error('Error updating shift:', error);
      throw new Error('Failed to update shift');
    }
  }

  // Method overloading for interface compatibility
  async delete(id: string): Promise<void>;
  async delete(id: string, tenantId: string): Promise<void>;
  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const whereClause: any = { id };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }
      
      await prisma.shift.delete({
        where: whereClause,
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw new Error('Failed to delete shift');
    }
  }

  async toggleActive(id: string, tenantId: string, isActive: boolean): Promise<Shift> {
    try {
      const shift = await prisma.shift.update({
        where: { id, tenantId },
        data: { isActive },
      });
      return this.mapToEntity(shift);
    } catch (error) {
      console.error('Error toggling shift active status:', error);
      throw new Error('Failed to toggle shift active status');
    }
  }

  private mapToEntity(data: any): Shift {
    return new Shift(
      data.id,
      data.tenantId,
      data.name,
      data.startTime,
      data.endTime,
      data.isActive,
      data.calculateBeforeStartTime,
      data.hasBreakTime,
      data.breakDuration,
      data.minWorkingHours,
      data.maxWorkingHours,
      data.overtimeMultiplier,
      data.lateThreshold,
      data.earlyCheckInAllowed,
      data.color,
      data.description,
      data.createdAt,
      data.updatedAt
    );
  }
}