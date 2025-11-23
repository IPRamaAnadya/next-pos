import { Staff } from '../../domain/entities/Staff';
import { Salary } from '../../domain/entities/Salary';
import { Attendance } from '../../domain/entities/Attendance';
import { PayrollDetail } from '../../domain/entities/PayrollDetail';
import { StaffRepository, SalaryRepository, AttendanceRepository, PayrollDetailRepository } from '../../domain/repositories/StaffRepository';
import { StaffQueryOptions } from './interfaces/StaffQueryOptions';
import { StaffDomainService } from '../../domain/services/StaffDomainService';
import bcrypt from 'bcryptjs';

export class StaffUseCases {
  private static instance: StaffUseCases;

  private constructor(
    private staffRepository: StaffRepository,
    private salaryRepository: SalaryRepository,
    private attendanceRepository: AttendanceRepository,
    private payrollDetailRepository: PayrollDetailRepository
  ) {}

  public static getInstance(
    staffRepository: StaffRepository,
    salaryRepository: SalaryRepository,
    attendanceRepository: AttendanceRepository,
    payrollDetailRepository: PayrollDetailRepository
  ): StaffUseCases {
    if (!StaffUseCases.instance) {
      StaffUseCases.instance = new StaffUseCases(staffRepository, salaryRepository, attendanceRepository, payrollDetailRepository);
    }
    return StaffUseCases.instance;
  }

  // Staff Management
  async getStaffs(tenantId: string, options: StaffQueryOptions, requesterRole: string, isRequesterOwner: boolean, requesterStaffId?: string) {
    console.log(`[StaffUseCases] getStaffs called with:`, {
      tenantId,
      options,
      requesterRole,
      isRequesterOwner,
      requesterStaffId
    });
    
    const result = await this.staffRepository.findAll(tenantId, options);
    
    console.log(`[StaffUseCases] Repository returned:`, {
      dataCount: result.data.length,
      total: result.pagination.total,
      staffData: result.data.map(s => ({ id: s.id, role: s.role, username: s.username }))
    });
    
    // Apply business rules for role-based visibility
    result.data = StaffDomainService.filterStaffsByRole(result.data, requesterRole, isRequesterOwner, requesterStaffId);
    
    console.log(`[StaffUseCases] After filtering:`, {
      filteredCount: result.data.length
    });
    
    return result;
  }

  async getStaffById(id: string, tenantId: string, requesterStaffId: string, requesterRole: string, isRequesterOwner: boolean) {
    const staff = await this.staffRepository.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff not found');
    }

    console.log(`[StaffUseCases] getStaffById called with:`, {
      id,
      tenantId,
      requesterStaffId,
      requesterRole,
      isRequesterOwner
    });

    // Check if requester can view this staff
    if (
      !isRequesterOwner &&
      requesterRole !== 'MANAGER' &&
      requesterRole !== 'OWNER' &&
      requesterStaffId !== id
    ) {
      throw new Error('Access denied: Cannot view other staff details');
    }

    return staff;
  }

  async createStaff(data: {
    tenantId: string;
    username: string;
    password: string;
    role: string;
    isOwner?: boolean;
  }) {
    // Business validation
    StaffDomainService.validateUsername(data.username);
    StaffDomainService.validateRole(data.role);
    StaffDomainService.validatePassword(data.password);

    // Check username uniqueness
    const isUsernameUnique = await this.staffRepository.checkUsernameUniqueness(data.username, data.tenantId);
    if (!isUsernameUnique) {
      throw new Error(`Username '${data.username}' already exists in this tenant`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const staffData = {
      tenantId: data.tenantId,
      username: data.username,
      role: data.role,
      isOwner: data.isOwner || false,
      hashedPassword,
    };

    return await this.staffRepository.create(staffData);
  }

  async updateStaff(id: string, tenantId: string, updates: {
    username?: string;
    password?: string;
    role?: string;
  }, requesterStaffId: string, requesterRole: string, isRequesterOwner: boolean) {
    const existingStaff = await this.getStaffById(id, tenantId, requesterStaffId, requesterRole, isRequesterOwner);
    
    // Check if requester can edit this staff
    if (!existingStaff.canEditStaff(requesterStaffId) && !isRequesterOwner && requesterRole !== 'MANAGER') {
      throw new Error('Access denied: Cannot edit this staff');
    }

    // Business validation for updates
    if (updates.username !== undefined) {
      StaffDomainService.validateUsername(updates.username);
      
      // Check username uniqueness (excluding current staff)
      const isUsernameUnique = await this.staffRepository.checkUsernameUniqueness(updates.username, tenantId, id);
      if (!isUsernameUnique) {
        throw new Error(`Username '${updates.username}' already exists in this tenant`);
      }
    }

    if (updates.role !== undefined) {
      StaffDomainService.validateRole(updates.role);
      
      // Prevent changing owner role
      if (existingStaff.isOwner && updates.role !== existingStaff.role) {
        throw new Error('Cannot change role of owner staff');
      }
    }

    const updateData: any = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.role) updateData.role = updates.role;
    
    if (updates.password) {
      StaffDomainService.validatePassword(updates.password);
      updateData.hashedPassword = await bcrypt.hash(updates.password, 10);
    }

    return await this.staffRepository.update(id, tenantId, updateData);
  }

  async deleteStaff(id: string, tenantId: string, requesterRole: string, isRequesterOwner: boolean) {
    const staff = await this.staffRepository.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff not found');
    }
    
    // Check if requester can delete staff
    if (!isRequesterOwner && requesterRole !== 'MANAGER') {
      throw new Error('Access denied: Cannot delete staff');
    }

    // Check if staff has active payroll
    const payrollDetails = await this.payrollDetailRepository.findAll(tenantId);
    const hasActivePayroll = payrollDetails.some(pd => pd.staffId === id && !pd.isPaid);
    
    // Apply business rules for deletion
    const deleteCheck = StaffDomainService.canDeleteStaff(staff, hasActivePayroll);
    if (!deleteCheck.canDelete) {
      throw new Error(deleteCheck.reason!);
    }

    await this.staffRepository.delete(id, tenantId);
  }

  // Salary Management
  async getStaffSalary(staffId: string, tenantId: string, requesterStaffId: string, requesterRole: string, isRequesterOwner: boolean) {
    // Check access permissions
    if (!isRequesterOwner && requesterRole !== 'MANAGER' && requesterStaffId !== staffId) {
      throw new Error('Access denied: Cannot view salary details');
    }

    const salary = await this.salaryRepository.findByStaffId(staffId, tenantId);
    if (!salary) {
      throw new Error('Salary not found for this staff');
    }

    return salary;
  }

  async createOrUpdateStaffSalary(staffId: string, tenantId: string, data: {
    basicSalary: number;
    fixedAllowance?: number;
    type?: 'MONTHLY' | 'HOURLY';
  }, requesterRole: string, isRequesterOwner: boolean) {
    // Check permissions
    if (!isRequesterOwner && requesterRole !== 'MANAGER') {
      throw new Error('Access denied: Cannot manage salaries');
    }

    // Validate staff exists
    const staff = await this.staffRepository.findById(staffId, tenantId);
    if (!staff) {
      throw new Error('Staff not found');
    }

    // Business validation
    StaffDomainService.validateSalaryAmount(data.basicSalary);
    if (data.fixedAllowance !== undefined) {
      StaffDomainService.validateSalaryAmount(data.fixedAllowance);
    }

    const existingSalary = await this.salaryRepository.findByStaffId(staffId, tenantId);
    
    if (existingSalary) {
      return await this.salaryRepository.update(staffId, tenantId, {
        basicSalary: data.basicSalary,
        fixedAllowance: data.fixedAllowance || 0,
        type: data.type || 'MONTHLY',
      });
    } else {
      return await this.salaryRepository.create({
        tenantId,
        staffId,
        basicSalary: data.basicSalary,
        fixedAllowance: data.fixedAllowance || 0,
        type: data.type || 'MONTHLY',
      });
    }
  }

  async deleteStaffSalary(staffId: string, tenantId: string, requesterRole: string, isRequesterOwner: boolean) {
    // Check permissions
    if (!isRequesterOwner && requesterRole !== 'MANAGER') {
      throw new Error('Access denied: Cannot manage salaries');
    }

    const salary = await this.salaryRepository.findByStaffId(staffId, tenantId);
    if (!salary) {
      throw new Error('Salary not found for this staff');
    }

    await this.salaryRepository.delete(staffId, tenantId);
  }

  // Attendance Management
  async getStaffAttendance(staffId: string, tenantId: string, startDate?: Date, endDate?: Date, requesterStaffId?: string, requesterRole?: string, isRequesterOwner?: boolean) {
    // Check access permissions
    if (requesterStaffId && !isRequesterOwner && requesterRole !== 'MANAGER' && requesterStaffId !== staffId) {
      throw new Error('Access denied: Cannot view attendance details');
    }

    if (startDate && endDate) {
      return await this.attendanceRepository.findByStaffAndDateRange(staffId, startDate, endDate, tenantId);
    }
    
    return await this.attendanceRepository.findAll(tenantId, staffId);
  }

  async checkIn(staffId: string, tenantId: string, checkInTime: string, date?: Date) {
    const attendanceDate = date || new Date();
    
    // Validate time format
    StaffDomainService.validateAttendanceTime(checkInTime);

    // Check if already checked in today
    const existingAttendance = await this.attendanceRepository.findByStaffAndDate(staffId, attendanceDate, tenantId);
    if (existingAttendance && existingAttendance.hasCheckedIn()) {
      throw new Error('Already checked in for today');
    }

    const isWeekend = attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6;

    if (existingAttendance) {
      return await this.attendanceRepository.update(existingAttendance.id, tenantId, {
        checkInTime,
      });
    } else {
      return await this.attendanceRepository.create({
        tenantId,
        staffId,
        date: attendanceDate,
        checkInTime,
        isWeekend,
      });
    }
  }

  async checkOut(staffId: string, tenantId: string, checkOutTime: string, date?: Date) {
    const attendanceDate = date || new Date();
    
    // Validate time format
    StaffDomainService.validateAttendanceTime(checkOutTime);

    // Find existing attendance
    const existingAttendance = await this.attendanceRepository.findByStaffAndDate(staffId, attendanceDate, tenantId);
    if (!existingAttendance) {
      throw new Error('No check-in record found for today');
    }

    if (!existingAttendance.hasCheckedIn()) {
      throw new Error('Must check in first before checking out');
    }

    if (existingAttendance.hasCheckedOut()) {
      throw new Error('Already checked out for today');
    }

    // Calculate total hours
    const checkIn = new Date(`1970-01-01T${existingAttendance.checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    return await this.attendanceRepository.update(existingAttendance.id, tenantId, {
      checkOutTime,
      totalHours,
    });
  }
}