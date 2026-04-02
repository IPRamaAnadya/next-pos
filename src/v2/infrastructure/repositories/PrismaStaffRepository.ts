import { Staff } from '../../domain/entities/Staff';
import { StaffRepository, PaginatedStaffs } from '../../domain/repositories/StaffRepository';
import { StaffQueryOptions } from '../../application/use-cases/interfaces/StaffQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaStaffRepository implements StaffRepository {
  private static instance: PrismaStaffRepository;

  private constructor() {}

  public static getInstance(): PrismaStaffRepository {
    if (!PrismaStaffRepository.instance) {
      PrismaStaffRepository.instance = new PrismaStaffRepository();
    }
    return PrismaStaffRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'is_owner': 'isOwner',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'isOwner', 'role', 'username', 'createdAt', 'updatedAt'
  ]);

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<Staff | null> {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id, tenantId },
      });

      if (!staff) return null;
      return this.mapToEntity(staff);
    } catch (error) {
      console.error('Error finding staff by ID:', error);
      throw new Error(`Failed to find staff with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: StaffQueryOptions): Promise<PaginatedStaffs> {
    try {
      const { limit, page, sortBy, sortDir, search, role, isOwner, includeOwner } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply search filter (searches username)
      if (search) {
        whereClause.username = { contains: search, mode: 'insensitive' };
      }

      // Apply role filter
      if (role) {
        whereClause.role = role;
      }

      // Apply owner filter
      if (isOwner !== undefined) {
        whereClause.isOwner = isOwner;
      }

      // Exclude owners if specified
      if (includeOwner === false) {
        whereClause.isOwner = false;
      }

      const totalCount = await prisma.staff.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const staffs = await prisma.staff.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
        select: {
          id: true,
          tenantId: true,
          isOwner: true,
          role: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password from results
        },
      });

      return {
        data: staffs.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding staffs:', error);
      throw new Error('Failed to retrieve staffs');
    }
  }

  async create(data: { tenantId: string; username: string; role: string; isOwner: boolean; hashedPassword: string }): Promise<Staff> {
    try {
      const staff = await prisma.staff.create({
        data: {
          tenantId: data.tenantId,
          username: data.username,
          role: data.role,
          isOwner: data.isOwner,
          password: data.hashedPassword,
        },
      });
      return this.mapToEntity(staff);
    } catch (error) {
      console.error('Error creating staff:', error);
      throw new Error('Failed to create staff');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<{ username: string; role: string; hashedPassword?: string }>): Promise<Staff> {
    try {
      const updateData: any = {};
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.hashedPassword !== undefined) updateData.password = updates.hashedPassword;

      const staff = await prisma.staff.update({
        where: { id, tenantId },
        data: updateData,
      });
      return this.mapToEntity(staff);
    } catch (error) {
      console.error('Error updating staff:', error);
      throw new Error('Failed to update staff');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.staff.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw new Error('Failed to delete staff');
    }
  }

  async findByUsername(username: string, tenantId: string): Promise<Staff | null> {
    try {
      const staff = await prisma.staff.findFirst({
        where: { username, tenantId },
      });

      if (!staff) return null;
      return this.mapToEntity(staff);
    } catch (error) {
      console.error('Error finding staff by username:', error);
      throw new Error(`Failed to find staff with username: ${username}`);
    }
  }

  async findByUsernameWithPassword(username: string, tenantId: string): Promise<{ staff: Staff; password: string } | null> {
    try {
      const staff = await prisma.staff.findFirst({
        where: { username, tenantId },
      });

      if (!staff) return null;
      return {
        staff: this.mapToEntity(staff),
        password: staff.password
      };
    } catch (error) {
      console.error('Error finding staff by username with password:', error);
      throw new Error(`Failed to find staff with username: ${username}`);
    }
  }

  async checkUsernameUniqueness(username: string, tenantId: string, excludeId?: string): Promise<boolean> {
    try {
      const whereClause: any = { username, tenantId };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const existingStaff = await prisma.staff.findFirst({
        where: whereClause,
      });

      return !existingStaff;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      throw new Error('Failed to check username uniqueness');
    }
  }

  async countStaffsByTenant(tenantId: string): Promise<number> {
    try {
      return await prisma.staff.count({
        where: { tenantId },
      });
    } catch (error) {
      console.error('Error counting staffs by tenant:', error);
      throw new Error('Failed to count staffs');
    }
  }

  private mapToEntity(data: any): Staff {
    return new Staff(
      data.id,
      data.tenantId,
      data.isOwner,
      data.role,
      data.username,
      data.createdAt,
      data.updatedAt
    );
  }
}